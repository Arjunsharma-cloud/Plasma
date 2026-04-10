package main

import (
    "database/sql"
    "encoding/json"
    "log"
    "net/http"
    "os"
    "time"
    
    "github.com/gorilla/mux"
    _ "github.com/lib/pq"
)

var db *sql.DB

func main() {
    // Connect to PostgreSQL
    connStr := "host=auth-db port=5432 user=auth_user password=auth_password dbname=auth_db sslmode=disable"
    var err error
    db, err = sql.Open("postgres", connStr)
    if err != nil {
        log.Fatal("Failed to connect to database:", err)
    }
    defer db.Close()
    
    // Test connection
    err = db.Ping()
    if err != nil {
        log.Fatal("Cannot reach database:", err)
    }
    log.Println("Connected to auth database")
    
    // Create users table (NEW SCHEMA)
    createUsersTable := `
    CREATE TABLE IF NOT EXISTS users (
        user_id        BIGSERIAL PRIMARY KEY,
        email          VARCHAR UNIQUE NOT NULL,
        password_hash  VARCHAR NOT NULL,
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`
    _, err = db.Exec(createUsersTable)
    if err != nil {
        log.Fatal("Failed to create users table:", err)
    }
    
    // Create user_profiles table (NEW SCHEMA)
    createProfilesTable := `
    CREATE TABLE IF NOT EXISTS user_profiles (
        user_id     BIGINT PRIMARY KEY,
        first_name  VARCHAR,
        last_name   VARCHAR,
        phone       VARCHAR,
        college     VARCHAR,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );`
    _, err = db.Exec(createProfilesTable)
    if err != nil {
        log.Fatal("Failed to create user_profiles table:", err)
    }
    
    log.Println("Auth database schema ready")
    
    r := mux.NewRouter()
    r.HandleFunc("/health", healthCheck).Methods("GET")
    r.HandleFunc("/api/auth/register", registerHandler).Methods("POST")
    r.HandleFunc("/api/auth/login", loginHandler).Methods("POST")
    r.HandleFunc("/api/auth/profile/{user_id}", getProfileHandler).Methods("GET")
    r.HandleFunc("/api/auth/profile/{user_id}", updateProfileHandler).Methods("PUT")
    
    port := os.Getenv("PORT")
    if port == "" { port = "8082" }
    log.Printf("Auth service starting on port %s", port)
    log.Fatal(http.ListenAndServe(":"+port, r))
}

func healthCheck(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{
        "status": "ok", 
        "service": "auth",
    })
}

type RegisterRequest struct {
    Email     string `json:"email"`
    Password  string `json:"password"`
    FirstName string `json:"first_name"`
    LastName  string `json:"last_name"`
    Phone     string `json:"phone"`
    College   string `json:"college"`
}

func registerHandler(w http.ResponseWriter, r *http.Request) {
    var req RegisterRequest
    json.NewDecoder(r.Body).Decode(&req)
    
    // Start transaction
    tx, err := db.Begin()
    if err != nil {
        w.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(w).Encode(map[string]string{"error": "database error"})
        return
    }
    
    // Insert into users table
    var userID int64
    err = tx.QueryRow(`
        INSERT INTO users (email, password_hash) 
        VALUES ($1, $2) 
        RETURNING user_id`,
        req.Email, req.Password).Scan(&userID)
    
    if err != nil {
        tx.Rollback()
        w.WriteHeader(http.StatusConflict)
        json.NewEncoder(w).Encode(map[string]string{"error": "user already exists"})
        return
    }
    
    // Insert into user_profiles table
    _, err = tx.Exec(`
        INSERT INTO user_profiles (user_id, first_name, last_name, phone, college) 
        VALUES ($1, $2, $3, $4, $5)`,
        userID, req.FirstName, req.LastName, req.Phone, req.College)
    
    if err != nil {
        tx.Rollback()
        w.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(w).Encode(map[string]string{"error": "failed to create profile"})
        return
    }
    
    tx.Commit()
    
    json.NewEncoder(w).Encode(map[string]interface{}{
        "message": "user registered successfully",
        "user_id": userID,
        "email": req.Email,
    })
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
    var creds map[string]string
    json.NewDecoder(r.Body).Decode(&creds)
    
    var userID int64
    var email string
    err := db.QueryRow(`
        SELECT user_id, email FROM users 
        WHERE email=$1 AND password_hash=$2`,
        creds["email"], creds["password"]).Scan(&userID, &email)
    
    if err == sql.ErrNoRows {
        w.WriteHeader(http.StatusUnauthorized)
        json.NewEncoder(w).Encode(map[string]string{"error": "invalid credentials"})
        return
    }
    
    if err != nil {
        w.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(w).Encode(map[string]string{"error": "database error"})
        return
    }
    
    json.NewEncoder(w).Encode(map[string]interface{}{
        "token": "jwt-token-" + time.Now().String(),
        "message": "login successful",
        "user_id": userID,
        "email": email,
    })
}

func getProfileHandler(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    userID := vars["user_id"]
    
    var profile struct {
        UserID    int64  `json:"user_id"`
        Email     string `json:"email"`
        FirstName string `json:"first_name"`
        LastName  string `json:"last_name"`
        Phone     string `json:"phone"`
        College   string `json:"college"`
        CreatedAt string `json:"created_at"`
    }
    
    err := db.QueryRow(`
        SELECT u.user_id, u.email, u.created_at, 
               COALESCE(p.first_name, ''), COALESCE(p.last_name, ''), 
               COALESCE(p.phone, ''), COALESCE(p.college, '')
        FROM users u
        LEFT JOIN user_profiles p ON u.user_id = p.user_id
        WHERE u.user_id = $1`, userID).Scan(
        &profile.UserID, &profile.Email, &profile.CreatedAt,
        &profile.FirstName, &profile.LastName, &profile.Phone, &profile.College)
    
    if err == sql.ErrNoRows {
        w.WriteHeader(http.StatusNotFound)
        json.NewEncoder(w).Encode(map[string]string{"error": "user not found"})
        return
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(profile)
}

func updateProfileHandler(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    userID := vars["user_id"]
    
    var profile map[string]string
    json.NewDecoder(r.Body).Decode(&profile)
    
    _, err := db.Exec(`
        UPDATE user_profiles 
        SET first_name=$1, last_name=$2, phone=$3, college=$4 
        WHERE user_id=$5`,
        profile["first_name"], profile["last_name"], 
        profile["phone"], profile["college"], userID)
    
    if err != nil {
        w.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(w).Encode(map[string]string{"error": "failed to update profile"})
        return
    }
    
    json.NewEncoder(w).Encode(map[string]string{"message": "profile updated successfully"})
}
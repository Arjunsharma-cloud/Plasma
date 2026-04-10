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

var db *sql.DB      // registration database
var eventDB *sql.DB // event database (for reading events)

func main() {
    var err error
    
    // Connect to registration database
    regConnStr := "host=registration-db port=5432 user=registration_user password=registration_password dbname=registration_db sslmode=disable"
    db, err = sql.Open("postgres", regConnStr)
    if err != nil {
        log.Fatal("Failed to connect to registration database:", err)
    }
    defer db.Close()
    
    // Test registration database connection
    err = db.Ping()
    if err != nil {
        log.Fatal("Cannot reach registration database:", err)
    }
    log.Println("Connected to registration database")
    
    // Connect to event database
    eventConnStr := "host=event-db port=5432 user=event_user password=event_password dbname=event_db sslmode=disable"
    eventDB, err = sql.Open("postgres", eventConnStr)
    if err != nil {
        log.Fatal("Failed to connect to event database:", err)
    }
    defer eventDB.Close()
    
    // Test event database connection
    err = eventDB.Ping()
    if err != nil {
        log.Fatal("Cannot reach event database:", err)
    }
    log.Println("Connected to event database")
    
    // Verify eventDB can query events
    var testCount int
    err = eventDB.QueryRow("SELECT COUNT(*) FROM events").Scan(&testCount)
    if err != nil {
        log.Fatal("Cannot query events from event database:", err)
    }
    log.Printf("Found %d events in event database", testCount)
    
    // Create teams table in registration database
    createTeamsTable := `
    CREATE TABLE IF NOT EXISTS teams (
        team_id     BIGSERIAL PRIMARY KEY,
        event_id    BIGINT NOT NULL,
        team_name   VARCHAR NOT NULL,
        created_by  BIGINT NOT NULL,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`
    _, err = db.Exec(createTeamsTable)
    if err != nil {
        log.Fatal("Failed to create teams table:", err)
    }
    
    // Create team_members table
    createTeamMembersTable := `
    CREATE TABLE IF NOT EXISTS team_members (
        team_id     BIGINT NOT NULL,
        user_id     BIGINT NOT NULL,
        joined_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (team_id, user_id)
    );`
    _, err = db.Exec(createTeamMembersTable)
    if err != nil {
        log.Fatal("Failed to create team_members table:", err)
    }
    
    // Create registrations table
    createRegistrationsTable := `
    CREATE TABLE IF NOT EXISTS registrations (
        registration_id BIGSERIAL PRIMARY KEY,
        event_id        BIGINT NOT NULL,
        team_id         BIGINT NOT NULL,
        status          VARCHAR DEFAULT 'pending',
        registered_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_id, team_id)
    );`
    _, err = db.Exec(createRegistrationsTable)
    if err != nil {
        log.Fatal("Failed to create registrations table:", err)
    }
    
    log.Println("Registration database schema ready")
    
    r := mux.NewRouter()
    r.HandleFunc("/health", healthCheck).Methods("GET")
    r.HandleFunc("/api/teams", createTeam).Methods("POST")
    r.HandleFunc("/api/teams/event/{event_id}", getTeamsByEvent).Methods("GET")
    r.HandleFunc("/api/teams/{team_id}/members", addTeamMember).Methods("POST")
    r.HandleFunc("/api/teams/user/{user_id}", getTeamsByUser).Methods("GET")
    r.HandleFunc("/api/registrations", registerTeam).Methods("POST")
    r.HandleFunc("/api/registrations/event/{event_id}", getRegistrationsByEvent).Methods("GET")
    r.HandleFunc("/api/registrations/team/{team_id}", getRegistrationByTeam).Methods("GET")
    r.HandleFunc("/api/registrations/{registration_id}/status", updateRegistrationStatus).Methods("PUT")
    
    port := os.Getenv("PORT")
    if port == "" {
        port = "8084"
    }
    log.Printf("Registration service starting on port %s", port)
    log.Fatal(http.ListenAndServe(":"+port, r))
}

func healthCheck(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    
    // Check database connections
    dbOk := db.Ping() == nil
    eventDbOk := eventDB != nil && eventDB.Ping() == nil
    
    status := "ok"
    if !dbOk || !eventDbOk {
        status = "degraded"
    }
    
    json.NewEncoder(w).Encode(map[string]interface{}{
        "status": status,
        "service": "registration",
        "registration_db": dbOk,
        "event_db": eventDbOk,
    })
}

type CreateTeamRequest struct {
    EventID   int64  `json:"event_id"`
    TeamName  string `json:"team_name"`
    CreatedBy int64  `json:"created_by"`
}

func createTeam(w http.ResponseWriter, r *http.Request) {
    var req CreateTeamRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        w.WriteHeader(http.StatusBadRequest)
        json.NewEncoder(w).Encode(map[string]string{"error": "invalid request body"})
        return
    }
    
    log.Printf("Creating team for event_id: %d, team_name: %s, created_by: %d", req.EventID, req.TeamName, req.CreatedBy)
    
    // Check if eventDB is initialized
    if eventDB == nil {
        w.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(w).Encode(map[string]string{"error": "event database not connected"})
        return
    }
    
    // Query from EVENT database
    var minTeam, maxTeam int
    err := eventDB.QueryRow(`
        SELECT COALESCE(min_team_size, 1), COALESCE(max_team_size, 1)
        FROM events WHERE event_id = $1`, req.EventID).Scan(&minTeam, &maxTeam)
    
    if err != nil {
        log.Printf("Error querying event %d: %v", req.EventID, err)
        w.WriteHeader(http.StatusNotFound)
        json.NewEncoder(w).Encode(map[string]string{"error": "event not found"})
        return
    }
    
    log.Printf("Event found: min_team_size=%d, max_team_size=%d", minTeam, maxTeam)
    
    // Start transaction for registration database
    tx, err := db.Begin()
    if err != nil {
        w.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(w).Encode(map[string]string{"error": "database error"})
        return
    }
    
    var teamID int64
    err = tx.QueryRow(`
        INSERT INTO teams (event_id, team_name, created_by) 
        VALUES ($1, $2, $3) RETURNING team_id`,
        req.EventID, req.TeamName, req.CreatedBy).Scan(&teamID)
    
    if err != nil {
        tx.Rollback()
        log.Printf("Error creating team: %v", err)
        w.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(w).Encode(map[string]string{"error": "failed to create team"})
        return
    }
    
    _, err = tx.Exec(`
        INSERT INTO team_members (team_id, user_id) 
        VALUES ($1, $2)`, teamID, req.CreatedBy)
    
    if err != nil {
        tx.Rollback()
        log.Printf("Error adding team member: %v", err)
        w.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(w).Encode(map[string]string{"error": "failed to add team member"})
        return
    }
    
    tx.Commit()
    
    log.Printf("Team created successfully with ID: %d", teamID)
    
    json.NewEncoder(w).Encode(map[string]interface{}{
        "message": "team created successfully",
        "team_id": teamID,
        "team_name": req.TeamName,
    })
}

// Keep other functions (getTeamsByEvent, addTeamMember, etc.) from your existing code
func getTeamsByEvent(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    eventID := vars["event_id"]
    
    rows, err := db.Query(`
        SELECT t.team_id, t.team_name, t.created_by, 
               COALESCE(COUNT(tm.user_id), 0) as member_count
        FROM teams t
        LEFT JOIN team_members tm ON t.team_id = tm.team_id
        WHERE t.event_id = $1
        GROUP BY t.team_id, t.team_name, t.created_by`, eventID)
    
    if err != nil {
        w.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(w).Encode(map[string]string{"error": "database error"})
        return
    }
    defer rows.Close()
    
    var teams []map[string]interface{}
    for rows.Next() {
        var id, createdBy int64
        var name string
        var memberCount int
        rows.Scan(&id, &name, &createdBy, &memberCount)
        teams = append(teams, map[string]interface{}{
            "team_id": id,
            "team_name": name,
            "created_by": createdBy,
            "member_count": memberCount,
        })
    }
    json.NewEncoder(w).Encode(teams)
}

func addTeamMember(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    teamID := vars["team_id"]
    
    var req struct {
        UserID int64 `json:"user_id"`
    }
    json.NewDecoder(r.Body).Decode(&req)
    
    _, err := db.Exec(`
        INSERT INTO team_members (team_id, user_id) 
        VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        teamID, req.UserID)
    
    if err != nil {
        w.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(w).Encode(map[string]string{"error": "failed to add member"})
        return
    }
    
    json.NewEncoder(w).Encode(map[string]string{"message": "member added successfully"})
}

func getTeamsByUser(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    userID := vars["user_id"]
    
    rows, err := db.Query(`
        SELECT t.team_id, t.team_name, t.event_id
        FROM teams t
        JOIN team_members tm ON t.team_id = tm.team_id
        WHERE tm.user_id = $1`, userID)
    
    if err != nil {
        w.WriteHeader(http.StatusInternalServerError)
        return
    }
    defer rows.Close()
    
    var teams []map[string]interface{}
    for rows.Next() {
        var id, eventID int64
        var name string
        rows.Scan(&id, &name, &eventID)
        teams = append(teams, map[string]interface{}{
            "team_id": id,
            "team_name": name,
            "event_id": eventID,
        })
    }
    json.NewEncoder(w).Encode(teams)
}

func registerTeam(w http.ResponseWriter, r *http.Request) {
    var req struct {
        EventID int64 `json:"event_id"`
        TeamID  int64 `json:"team_id"`
    }
    json.NewDecoder(r.Body).Decode(&req)
    
    var regID int64
    err := db.QueryRow(`
        INSERT INTO registrations (event_id, team_id, status) 
        VALUES ($1, $2, 'pending') 
        ON CONFLICT (event_id, team_id) DO NOTHING
        RETURNING registration_id`,
        req.EventID, req.TeamID).Scan(&regID)
    
    if err == sql.ErrNoRows {
        w.WriteHeader(http.StatusConflict)
        json.NewEncoder(w).Encode(map[string]string{"error": "team already registered"})
        return
    }
    
    if err != nil {
        w.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(w).Encode(map[string]string{"error": "failed to register"})
        return
    }
    
    json.NewEncoder(w).Encode(map[string]interface{}{
        "message": "registration successful",
        "registration_id": regID,
        "status": "pending",
    })
}

func getRegistrationsByEvent(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    eventID := vars["event_id"]
    
    rows, err := db.Query(`
        SELECT r.registration_id, r.team_id, t.team_name, r.status, r.registered_at
        FROM registrations r
        JOIN teams t ON r.team_id = t.team_id
        WHERE r.event_id = $1`, eventID)
    
    if err != nil {
        w.WriteHeader(http.StatusInternalServerError)
        return
    }
    defer rows.Close()
    
    var registrations []map[string]interface{}
    for rows.Next() {
        var regID, teamID int64
        var teamName, status, registeredAt string
        rows.Scan(&regID, &teamID, &teamName, &status, &registeredAt)
        registrations = append(registrations, map[string]interface{}{
            "registration_id": regID,
            "team_id": teamID,
            "team_name": teamName,
            "status": status,
            "registered_at": registeredAt,
        })
    }
    json.NewEncoder(w).Encode(registrations)
}

func getRegistrationByTeam(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    teamID := vars["team_id"]
    
    var regID, eventID int64
    var status, registeredAt string
    
    err := db.QueryRow(`
        SELECT registration_id, event_id, status, registered_at
        FROM registrations
        WHERE team_id = $1`, teamID).Scan(&regID, &eventID, &status, &registeredAt)
    
    if err == sql.ErrNoRows {
        w.WriteHeader(http.StatusNotFound)
        json.NewEncoder(w).Encode(map[string]string{"error": "registration not found"})
        return
    }
    
    json.NewEncoder(w).Encode(map[string]interface{}{
        "registration_id": regID,
        "event_id": eventID,
        "status": status,
        "registered_at": registeredAt,
    })
}

func updateRegistrationStatus(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    regID := vars["registration_id"]
    
    var req struct {
        Status string `json:"status"`
    }
    json.NewDecoder(r.Body).Decode(&req)
    
    _, err := db.Exec(`
        UPDATE registrations 
        SET status = $1 
        WHERE registration_id = $2`,
        req.Status, regID)
    
    if err != nil {
        w.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(w).Encode(map[string]string{"error": "failed to update status"})
        return
    }
    
    json.NewEncoder(w).Encode(map[string]interface{}{
        "message": "status updated successfully",
        "status": req.Status,
        "updated_at": time.Now().String(),
    })
}
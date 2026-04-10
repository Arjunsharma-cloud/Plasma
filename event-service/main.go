package main

import (
    "database/sql"
    "encoding/json"
    "log"
    "net/http"
    "os"
    
    "github.com/gorilla/mux"
    _ "github.com/lib/pq"
)

var db *sql.DB

func main() {
    connStr := "host=event-db port=5432 user=event_user password=event_password dbname=event_db sslmode=disable"
    var err error
    db, err = sql.Open("postgres", connStr)
    if err != nil {
        log.Fatal("Failed to connect to database:", err)
    }
    defer db.Close()
    
    err = db.Ping()
    if err != nil {
        log.Fatal("Cannot reach database:", err)
    }
    log.Println("Connected to event database")
    
    // Create organizations table
    createOrgsTable := `
    CREATE TABLE IF NOT EXISTS organizations (
        org_id     BIGSERIAL PRIMARY KEY,
        org_name   VARCHAR NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`
    db.Exec(createOrgsTable)
    
    // Create hosts table
    createHostsTable := `
    CREATE TABLE IF NOT EXISTS hosts (
        host_id    BIGSERIAL PRIMARY KEY,
        name       VARCHAR NOT NULL,
        email      VARCHAR,
        org_id     BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (org_id) REFERENCES organizations(org_id) ON DELETE SET NULL
    );`
    db.Exec(createHostsTable)
    
    // Create events table
    createEventsTable := `
    CREATE TABLE IF NOT EXISTS events (
        event_id              BIGSERIAL PRIMARY KEY,
        title                 VARCHAR NOT NULL,
        description           TEXT,
        event_date            TIMESTAMP,
        registration_deadline TIMESTAMP,
        capacity              INT DEFAULT 0,
        location              VARCHAR,
        prize                 VARCHAR,
        event_type            VARCHAR,
        min_team_size         INT DEFAULT 1,
        max_team_size         INT DEFAULT 1,
        host_id               BIGINT,
        created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (host_id) REFERENCES hosts(host_id) ON DELETE SET NULL
    );`
    db.Exec(createEventsTable)
    
    log.Println("Event database schema ready")
    
    r := mux.NewRouter()
    r.HandleFunc("/health", healthCheck).Methods("GET")
    
    // Organization routes
    r.HandleFunc("/api/organizations", createOrganization).Methods("POST")
    r.HandleFunc("/api/organizations", getOrganizations).Methods("GET")
    
    // Host routes
    r.HandleFunc("/api/hosts", createHost).Methods("POST")
    r.HandleFunc("/api/hosts", getHosts).Methods("GET")
    r.HandleFunc("/api/hosts/org/{org_id}", getHostsByOrg).Methods("GET")
    
    // Event routes
    r.HandleFunc("/api/events", createEvent).Methods("POST")
    r.HandleFunc("/api/events", getEvents).Methods("GET")
    r.HandleFunc("/api/events/{id}", getEventByID).Methods("GET")
    r.HandleFunc("/api/events/host/{host_id}", getEventsByHost).Methods("GET")
    
    port := os.Getenv("PORT")
    if port == "" { port = "8083" }
    log.Printf("Event service starting on port %s", port)
    log.Fatal(http.ListenAndServe(":"+port, r))
}

func healthCheck(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{"status": "ok", "service": "event"})
}

// Organization Handlers
func createOrganization(w http.ResponseWriter, r *http.Request) {
    var org struct {
        OrgName string `json:"org_name"`
    }
    json.NewDecoder(r.Body).Decode(&org)
    
    var orgID int64
    err := db.QueryRow("INSERT INTO organizations (org_name) VALUES ($1) RETURNING org_id", org.OrgName).Scan(&orgID)
    if err != nil {
        w.WriteHeader(http.StatusConflict)
        json.NewEncoder(w).Encode(map[string]string{"error": "organization already exists"})
        return
    }
    
    json.NewEncoder(w).Encode(map[string]interface{}{"org_id": orgID, "org_name": org.OrgName})
}

func getOrganizations(w http.ResponseWriter, r *http.Request) {
    rows, err := db.Query("SELECT org_id, org_name, created_at FROM organizations ORDER BY org_name")
    if err != nil {
        w.WriteHeader(http.StatusInternalServerError)
        return
    }
    defer rows.Close()
    
    var orgs []map[string]interface{}
    for rows.Next() {
        var id int64
        var name, createdAt string
        rows.Scan(&id, &name, &createdAt)
        orgs = append(orgs, map[string]interface{}{
            "org_id": id, "org_name": name, "created_at": createdAt,
        })
    }
    json.NewEncoder(w).Encode(orgs)
}

// Host Handlers
func createHost(w http.ResponseWriter, r *http.Request) {
    var host struct {
        Name  string `json:"name"`
        Email string `json:"email"`
        OrgID int64  `json:"org_id"`
    }
    json.NewDecoder(r.Body).Decode(&host)
    
    var hostID int64
    err := db.QueryRow("INSERT INTO hosts (name, email, org_id) VALUES ($1, $2, $3) RETURNING host_id",
        host.Name, host.Email, host.OrgID).Scan(&hostID)
    
    if err != nil {
        w.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(w).Encode(map[string]string{"error": "failed to create host"})
        return
    }
    
    json.NewEncoder(w).Encode(map[string]interface{}{"host_id": hostID, "name": host.Name})
}

func getHosts(w http.ResponseWriter, r *http.Request) {
    rows, err := db.Query(`
        SELECT h.host_id, h.name, h.email, h.org_id, o.org_name 
        FROM hosts h
        LEFT JOIN organizations o ON h.org_id = o.org_id
        ORDER BY h.name`)
    if err != nil {
        w.WriteHeader(http.StatusInternalServerError)
        return
    }
    defer rows.Close()
    
    var hosts []map[string]interface{}
    for rows.Next() {
        var id int64
        var name, email, orgName string
        var orgID sql.NullInt64
        rows.Scan(&id, &name, &email, &orgID, &orgName)
        hosts = append(hosts, map[string]interface{}{
            "host_id": id, "name": name, "email": email,
            "org_id": orgID.Int64, "org_name": orgName,
        })
    }
    json.NewEncoder(w).Encode(hosts)
}

func getHostsByOrg(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    orgID := vars["org_id"]
    
    rows, err := db.Query("SELECT host_id, name, email FROM hosts WHERE org_id=$1", orgID)
    if err != nil {
        w.WriteHeader(http.StatusInternalServerError)
        return
    }
    defer rows.Close()
    
    var hosts []map[string]interface{}
    for rows.Next() {
        var id int64
        var name, email string
        rows.Scan(&id, &name, &email)
        hosts = append(hosts, map[string]interface{}{
            "host_id": id, "name": name, "email": email,
        })
    }
    json.NewEncoder(w).Encode(hosts)
}

// Event Handlers
type EventRequest struct {
    Title                string `json:"title"`
    Description          string `json:"description"`
    EventDate            string `json:"event_date"`
    RegistrationDeadline string `json:"registration_deadline"`
    Capacity             int    `json:"capacity"`
    Location             string `json:"location"`
    Prize                string `json:"prize"`
    EventType            string `json:"event_type"`
    MinTeamSize          int    `json:"min_team_size"`
    MaxTeamSize          int    `json:"max_team_size"`
    HostID               int64  `json:"host_id"`
}

func createEvent(w http.ResponseWriter, r *http.Request) {
    var req EventRequest
    json.NewDecoder(r.Body).Decode(&req)
    
    var eventID int64
    err := db.QueryRow(`
        INSERT INTO events (
            title, description, event_date, registration_deadline, 
            capacity, location, prize, event_type, min_team_size, max_team_size, host_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
        RETURNING event_id`,
        req.Title, req.Description, req.EventDate, req.RegistrationDeadline,
        req.Capacity, req.Location, req.Prize, req.EventType,
        req.MinTeamSize, req.MaxTeamSize, req.HostID).Scan(&eventID)
    
    if err != nil {
        w.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
        return
    }
    
    json.NewEncoder(w).Encode(map[string]interface{}{
        "message": "event created successfully",
        "event_id": eventID,
    })
}

func getEvents(w http.ResponseWriter, r *http.Request) {
    rows, err := db.Query(`
        SELECT e.event_id, e.title, e.description, e.event_date, 
               e.registration_deadline, e.capacity, e.location, e.prize,
               e.event_type, e.min_team_size, e.max_team_size,
               COALESCE(e.host_id, 0), COALESCE(h.name, '')
        FROM events e
        LEFT JOIN hosts h ON e.host_id = h.host_id
        ORDER BY e.event_date`)
    
    if err != nil {
        w.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
        return
    }
    defer rows.Close()
    
    var events []map[string]interface{}
    for rows.Next() {
        var id, hostID int64
        var title, desc, eventDate, regDeadline, location, prize, eventType, hostName string
        var capacity, minTeam, maxTeam int
        
        err := rows.Scan(&id, &title, &desc, &eventDate, &regDeadline,
            &capacity, &location, &prize, &eventType, &minTeam, &maxTeam,
            &hostID, &hostName)
        if err != nil {
            continue
        }
        
        events = append(events, map[string]interface{}{
            "event_id": id, "title": title, "description": desc,
            "event_date": eventDate, "registration_deadline": regDeadline,
            "capacity": capacity, "location": location, "prize": prize,
            "event_type": eventType, "min_team_size": minTeam, "max_team_size": maxTeam,
            "host_id": hostID, "host_name": hostName,
        })
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(events)
}

func getEventByID(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    id := vars["id"]
    
    var eventID, hostID int64
    var title, desc, eventDate, regDeadline, location, prize, eventType, hostName string
    var capacity, minTeam, maxTeam int
    
    err := db.QueryRow(`
        SELECT e.event_id, e.title, e.description, e.event_date, 
               e.registration_deadline, e.capacity, e.location, e.prize,
               e.event_type, e.min_team_size, e.max_team_size,
               COALESCE(e.host_id, 0), COALESCE(h.name, '')
        FROM events e
        LEFT JOIN hosts h ON e.host_id = h.host_id
        WHERE e.event_id = $1`, id).Scan(
        &eventID, &title, &desc, &eventDate, &regDeadline,
        &capacity, &location, &prize, &eventType, &minTeam, &maxTeam,
        &hostID, &hostName)
    
    if err == sql.ErrNoRows {
        w.WriteHeader(http.StatusNotFound)
        json.NewEncoder(w).Encode(map[string]string{"error": "event not found"})
        return
    }
    
    if err != nil {
        w.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(w).Encode(map[string]string{"error": "database error"})
        return
    }
    
    event := map[string]interface{}{
        "event_id": eventID, "title": title, "description": desc,
        "event_date": eventDate, "registration_deadline": regDeadline,
        "capacity": capacity, "location": location, "prize": prize,
        "event_type": eventType, "min_team_size": minTeam, "max_team_size": maxTeam,
        "host_id": hostID, "host_name": hostName,
    }
    
    json.NewEncoder(w).Encode(event)
}

func getEventsByHost(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    hostID := vars["host_id"]
    
    rows, err := db.Query(`
        SELECT event_id, title, event_date, capacity, location
        FROM events WHERE host_id=$1 ORDER BY event_date`, hostID)
    if err != nil {
        w.WriteHeader(http.StatusInternalServerError)
        return
    }
    defer rows.Close()
    
    var events []map[string]interface{}
    for rows.Next() {
        var id int64
        var title, eventDate, location string
        var capacity int
        rows.Scan(&id, &title, &eventDate, &capacity, &location)
        events = append(events, map[string]interface{}{
            "event_id": id, "title": title, "event_date": eventDate,
            "capacity": capacity, "location": location,
        })
    }
    json.NewEncoder(w).Encode(events)
}
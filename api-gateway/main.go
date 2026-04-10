package main

import (
    "encoding/json"
    "log"
    "net/http"
    "net/http/httputil"
    "net/url"
    "os"
    "strings"
    "time"

    "github.com/gorilla/mux"
)

type Gateway struct {
    authServiceURL         *url.URL
    eventServiceURL        *url.URL
    registrationServiceURL *url.URL
}

func NewGateway() *Gateway {
    authURL, _ := url.Parse(os.Getenv("AUTH_SERVICE_URL"))
    eventURL, _ := url.Parse(os.Getenv("EVENT_SERVICE_URL"))
    regURL, _ := url.Parse(os.Getenv("REGISTRATION_SERVICE_URL"))
    
    return &Gateway{
        authServiceURL:         authURL,
        eventServiceURL:        eventURL,
        registrationServiceURL: regURL,
    }
}

func (g *Gateway) proxy(target *url.URL) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        director := func(req *http.Request) {
            req.URL.Scheme = target.Scheme
            req.URL.Host = target.Host
            req.URL.Path = strings.TrimPrefix(r.URL.Path, "/api")
            req.Host = target.Host
        }
        
        proxy := &httputil.ReverseProxy{Director: director}
        proxy.ServeHTTP(w, r)
    }
}

func (g *Gateway) healthCheck(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{
        "status": "healthy",
        "service": "api-gateway",
        "timestamp": time.Now().String(),
    })
}

func main() {
    router := mux.NewRouter()
    gateway := NewGateway()
    
    // Routes
    router.HandleFunc("/health", gateway.healthCheck).Methods("GET")
    router.PathPrefix("/api/auth").Handler(gateway.proxy(gateway.authServiceURL))
    router.PathPrefix("/api/events").Handler(gateway.proxy(gateway.eventServiceURL))
    router.PathPrefix("/api/registrations").Handler(gateway.proxy(gateway.registrationServiceURL))
    
    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }
    
    log.Printf("API Gateway starting on port %s", port)
    log.Fatal(http.ListenAndServe(":"+port, router))
}
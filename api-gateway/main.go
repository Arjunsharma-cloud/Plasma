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
    rateLimiterURL         *url.URL
}

func NewGateway() *Gateway {
    authURL, _ := url.Parse(os.Getenv("AUTH_SERVICE_URL"))
    eventURL, _ := url.Parse(os.Getenv("EVENT_SERVICE_URL"))
    regURL, _ := url.Parse(os.Getenv("REGISTRATION_SERVICE_URL"))
    rateLimiterURL, _ := url.Parse(os.Getenv("RATE_LIMITER_URL"))
    
    return &Gateway{
        authServiceURL:         authURL,
        eventServiceURL:        eventURL,
        registrationServiceURL: regURL,
        rateLimiterURL:         rateLimiterURL,
    }
}

// checkRateLimit calls the rate limiter service before allowing request
func (g *Gateway) checkRateLimit(r *http.Request) bool {
    // Prepare request to rate limiter
    rateLimiterReq, err := http.NewRequest("GET", g.rateLimiterURL.String()+"/check", nil)
    if err != nil {
        log.Printf("Failed to create rate limiter request: %v", err)
        return true // Allow on error (fail open)
    }
    
    // Forward client IP and API key to rate limiter
    clientIP := r.RemoteAddr
    if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
        clientIP = strings.Split(xff, ",")[0]
    }
    rateLimiterReq.Header.Set("X-Client-IP", clientIP)
    rateLimiterReq.Header.Set("API_KEY", r.Header.Get("API_KEY"))
    
    // Call rate limiter
    client := &http.Client{Timeout: 100 * time.Millisecond}
    resp, err := client.Do(rateLimiterReq)
    if err != nil {
        log.Printf("Rate limiter unavailable: %v", err)
        return true // Allow on error (fail open)
    }
    defer resp.Body.Close()
    
    // Check if rate limited
    return resp.StatusCode == http.StatusOK
}

func (g *Gateway) proxyWithRateLimit(target *url.URL) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        // STEP 1: Check rate limit BEFORE proxying
        if !g.checkRateLimit(r) {
            w.Header().Set("Content-Type", "application/json")
            w.WriteHeader(http.StatusTooManyRequests)
            json.NewEncoder(w).Encode(map[string]string{
                "error": "too many requests",
                "message": "Rate limit exceeded. Please try again later.",
            })
            return
        }
        
        // STEP 2: Proxy to actual service
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
    
    // Routes with rate limiting
    router.HandleFunc("/health", gateway.healthCheck).Methods("GET")
    router.PathPrefix("/api/auth").HandlerFunc(gateway.proxyWithRateLimit(gateway.authServiceURL))
    router.PathPrefix("/api/events").HandlerFunc(gateway.proxyWithRateLimit(gateway.eventServiceURL))
    router.PathPrefix("/api/registrations").HandlerFunc(gateway.proxyWithRateLimit(gateway.registrationServiceURL))
    
    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }
    
    log.Printf("API Gateway starting on port %s", port)
    log.Fatal(http.ListenAndServe(":"+port, router))
}
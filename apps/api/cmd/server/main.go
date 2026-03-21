package main

import (
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
	grpcserver "github.com/sohanpatel/options-analyzer/api/internal/grpc"
	"github.com/sohanpatel/options-analyzer/api/internal/handlers"
	"github.com/sohanpatel/options-analyzer/api/internal/services"
	"github.com/sohanpatel/options-analyzer/api/internal/yahoo"
)

// version is the current release of the Options Analyzer API.
const version = "0.0.1"

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func main() {
	// Configuration from environment
	port := getEnv("PORT", "8080")
	grpcPort := getEnv("GRPC_PORT", "9090")
	ginMode := getEnv("GIN_MODE", "debug")
	// Parse ALLOWED_ORIGINS (comma-separated list)
	originsEnv := getEnv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001")
	var allowedOrigins []string
	for _, o := range strings.Split(originsEnv, ",") {
		if trimmed := strings.TrimSpace(o); trimmed != "" {
			allowedOrigins = append(allowedOrigins, trimmed)
		}
	}

	gin.SetMode(ginMode)

	// Initialize shared dependencies
	yahooClient := yahoo.NewClient()
	sp500Svc := services.NewSP500Service(yahooClient)
	optionsSvc := services.NewOptionsService(yahooClient, sp500Svc)
	backtestSvc := services.NewBacktestService(yahooClient)
	todaySvc := services.NewTodayService(optionsSvc, sp500Svc)
	newsSvc := services.NewNewsService(yahooClient)

	// Initialize handlers
	marketH := handlers.NewMarketHandler(yahooClient)
	stocksH := handlers.NewStocksHandler(sp500Svc, yahooClient)
	optionsH := handlers.NewOptionsHandler(optionsSvc)
	backtestH := handlers.NewBacktestHandler(backtestSvc)
	todayH := handlers.NewTodayHandler(todaySvc)
	newsH := handlers.NewNewsHandler(newsSvc)

	// Pre-warm both hot endpoints on startup so the first user after a deploy
	// hits warm caches. Google OAuth + Clerk callbacks take ~5s, giving the
	// server enough time to finish both scans before anyone reaches the dashboard.
	go func() {
		log.Println("pre-warming market overview cache…")
		marketH.WarmCache()
		log.Println("market overview cache ready")
	}()
	go func() {
		log.Println("pre-warming recommendations cache…")
		if _, err := optionsSvc.GetRecommendations(20); err != nil {
			log.Printf("recommendations warm-up failed: %v", err)
		} else {
			log.Println("recommendations cache ready")
		}
	}()

	// Start gRPC server in background
	grpcSrv := grpcserver.NewServer(":" + grpcPort)
	go grpcSrv.Start()

	// Set up Gin router
	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(gzip.Gzip(gzip.DefaultCompression))

	// CORS: configured via ALLOWED_ORIGINS env var
	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: false,
		MaxAge:           12 * time.Hour,
	}))

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "version": version, "time": time.Now().UTC()})
	})

	// API v1 routes
	v1 := r.Group("/api/v1")
	{
		v1.GET("/market/overview", marketH.GetOverview)

		v1.GET("/stocks", stocksH.ListStocks)
		v1.GET("/stocks/:symbol", stocksH.GetStock)
		v1.GET("/stocks/:symbol/history", stocksH.GetHistory)
		v1.GET("/stocks/:symbol/news", newsH.GetStockNews)
		v1.GET("/stocks/:symbol/options", optionsH.GetOptionsChain)
		v1.GET("/stocks/:symbol/options/filtered", optionsH.GetFilteredChain)
		v1.GET("/stocks/:symbol/options/analyze", optionsH.AnalyzeOption)

		v1.GET("/options/recommendations", optionsH.GetRecommendations)
		v1.GET("/options/today", todayH.GetOpportunities)

		v1.POST("/backtest", backtestH.RunBacktest)
	}

	log.Printf("Options Analyzer API v%s starting on :%s (mode=%s, origins=%v)", version, port, ginMode, allowedOrigins)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

package grpc

import (
	"log"
	"net"
	"time"

	"google.golang.org/grpc"
)

// Server is a minimal gRPC server stub
// Full proto generation requires protoc; this provides the server bootstrap
type Server struct {
	addr string
}

// NewServer creates a new gRPC server
func NewServer(addr string) *Server {
	return &Server{addr: addr}
}

// Start begins listening on the gRPC address
func (s *Server) Start() {
	lis, err := net.Listen("tcp", s.addr)
	if err != nil {
		log.Printf("gRPC: failed to listen on %s: %v", s.addr, err)
		return
	}

	grpcServer := grpc.NewServer()
	log.Printf("gRPC server listening on %s", s.addr)

	// Periodic health log to indicate server is alive
	go func() {
		for {
			time.Sleep(30 * time.Second)
			log.Println("gRPC server: streaming tick")
		}
	}()

	if err := grpcServer.Serve(lis); err != nil {
		log.Printf("gRPC server error: %v", err)
	}
}

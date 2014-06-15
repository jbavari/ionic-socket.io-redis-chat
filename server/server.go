package main

// import "fmt"
// import "github.com/gorilla/mux"
// import "net/http"

import (
	"fmt"
	// "github.com/gorilla/mux"
	"log"
	"net/http"
	"github.com/googollee/go-socket.io"
	"github.com/go-redis/redis"
	"time"
)

var client *redis.Client

func init() {
	log.Println("Initializing redis client")
	client = redis.NewTCPClient(&redis.Options{
		Addr: ":6379",
	})
}

func getMessages(channel string) {
	log.Println("We got a string ", channel)

}

func onConnect(ns *socketio.NameSpace) {
	fmt.Println("connected:", ns.Id(), " in channel ", ns.Endpoint())
	ns.Emit("message", "this is totally news", 3)
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	// name := r.URL.Path[len("/name="/"):]
	name := r.FormValue("name")
	password := r.FormValue("password")
	fmt.Fprintf(w, "Hello, %q password for %q", name, password)
	// log.Println("Listening...")
	// params := mux.Vars(r)
	// log.Println(params)
	// name := params["name"]
	// password := params["password"]
	// w.Write([]byte("Hello " + name + " and pw " + password))
}

func HomeHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("We are here in HomeHandler")

	// fmt.Fprintf(w, "HomeHandler")
}

func main() {
	// init()

	getMessages("Lobby")

    fmt.Printf("Redis Chat - online\n")
	// r := mux.NewRouter()

    http.HandleFunc("/login", LoginHandler)
    // r.PathPrefix("/").Handler(http.FileServer(http.Dir("../../client/RedisChat/www")))
    // r.Handle("/static", http.FileServer(http.Dir("../../client/RedisChat/www")))

    // r.Handle("/static", http.FileServer(http.Dir("./client/RedisChat/www")) )

    
    // http.Handle("/", r)
    // clientDirectory := http.Dir("../../client/RedisChat/www")
    clientDirectory := http.Dir("./client/RedisChat/www")
    // log.Println("We have clientDirectory " + clientDirectory)
    http.Handle("/", http.FileServer(clientDirectory))
    http.ListenAndServe(":8080", nil)

	// sock_config := &socketio.Config{}
	// sock_config.HeartbeatTimeout = 2
	// sock_config.ClosingTimeout = 4

	// sio := socketio.NewSocketIOServer(sock_config)

	// Handler for new connections, also adds socket.io event handlers
	// sio.On("connect", onConnect)
	// sio.On("disconnect", onDisconnect)
	// sio.On("news", news)
	// sio.On("ping", func(ns *socketio.NameSpace){
	// sio.Broadcast("pong", nil)
	// })

	//in politics channel
	// sio.Of("/pol").On("connect", onConnect)
	// sio.Of("/pol").On("disconnect", onDisconnect)
	// sio.Of("/pol").On("news", news)
	// sio.Of("/pol").On("ping", func(ns *socketio.NameSpace){
	// sio.In("/pol").Broadcast("pong", nil)
	// })


	// panic(http.ListenAndServe(":8080", http.FileServer(http.Dir("../../client/RedisChat/www"))))



}
import type { ChatMessage } from "../types";

export class WebSocketService {
  private clients: Set<any> = new Set();

  addClient(ws: any): void {
    this.clients.add(ws);
    console.log(
      `✅ WebSocket client connected. Total clients: ${this.clients.size}`,
    );
  }

  removeClient(ws: any): void {
    this.clients.delete(ws);
    console.log(
      `👋 WebSocket client disconnected. Total clients: ${this.clients.size}`,
    );
  }

  broadcast(message: ChatMessage): void {
    const data = JSON.stringify(message);
    let successCount = 0;
    let failCount = 0;

    this.clients.forEach((client) => {
      try {
        // Elysia WebSocket uses send() method directly
        if (client && typeof client.send === "function") {
          client.send(data);
          successCount++;
        } else {
          console.warn("⚠️  Client missing send method");
          failCount++;
          this.clients.delete(client);
        }
      } catch (error) {
        console.error("❌ Error sending message to client:", error);
        failCount++;
        // Remove dead connections
        this.clients.delete(client);
      }
    });

    if (successCount > 0) {
      console.log(`📤 Broadcasted to ${successCount} client(s)`);
    }

    if (failCount > 0) {
      console.warn(`⚠️  Failed to send to ${failCount} client(s)`);
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }

  cleanup(): void {
    this.clients.forEach((client) => {
      try {
        if (client && typeof client.close === "function") {
          client.close();
        }
      } catch (error) {
        console.error("❌ Error closing client connection:", error);
      }
    });
    this.clients.clear();
    console.log("🧹 WebSocket service cleaned up");
  }
}

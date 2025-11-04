import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Send } from "lucide-react";
import { useState } from "react";

const Messages = () => {
  const [selectedChat, setSelectedChat] = useState(1);
  const [messageText, setMessageText] = useState("");

  const conversations = [
    {
      id: 1,
      name: "Sarah Miller",
      lastMessage: "See you at the watch party!",
      time: "10m ago",
      unread: 2,
    },
    {
      id: 2,
      name: "Emma Johnson",
      lastMessage: "Did you catch the game last night?",
      time: "1h ago",
      unread: 0,
    },
    {
      id: 3,
      name: "Lisa Chen",
      lastMessage: "Thanks for the tips!",
      time: "3h ago",
      unread: 0,
    },
    {
      id: 4,
      name: "Maya Patel",
      lastMessage: "Count me in for the tournament",
      time: "1d ago",
      unread: 1,
    },
  ];

  const messages = [
    {
      id: 1,
      sender: "Sarah Miller",
      text: "Hey! Are you going to the WNBA watch party this weekend?",
      time: "2:30 PM",
      isOwn: false,
    },
    {
      id: 2,
      sender: "You",
      text: "Yes! I'm so excited. It's going to be amazing.",
      time: "2:32 PM",
      isOwn: true,
    },
    {
      id: 3,
      sender: "Sarah Miller",
      text: "Perfect! I'll save you a seat. See you there!",
      time: "2:35 PM",
      isOwn: false,
    },
    {
      id: 4,
      sender: "You",
      text: "See you at the watch party!",
      time: "2:36 PM",
      isOwn: true,
    },
  ];

  const handleSendMessage = () => {
    if (messageText.trim()) {
      // Handle sending message
      setMessageText("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DesktopNav />
      <BottomNav />
      
      <main className="md:ml-64 container mx-auto px-4 py-8 pb-20 md:pb-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-6">Messages</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
            {/* Conversations List */}
            <Card className="p-4 overflow-y-auto">
              <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-10"
                />
              </div>
              
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedChat(conv.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedChat === conv.id
                        ? "bg-primary/10 border-2 border-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-foreground">{conv.name}</h3>
                      <span className="text-xs text-muted-foreground">{conv.time}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.lastMessage}
                      </p>
                      {conv.unread > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2 flex-shrink-0">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Chat Area */}
            <Card className="md:col-span-2 flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-border">
                <h2 className="text-xl font-bold text-foreground">
                  {conversations.find((c) => c.id === selectedChat)?.name}
                </h2>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.isOwn
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <p className="mb-1">{msg.text}</p>
                      <p
                        className={`text-xs ${
                          msg.isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}
                      >
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage} size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Messages;

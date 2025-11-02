import React, { useState, useEffect } from "react";
import { Send } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "./Navbar";
import { ListingPreview } from "./ListingPreview";
import api from "../services/api";

// Types for chat functionality
interface Conversation {
  _id: string;
  listingId:
    | string
    | {
        _id: string;
        listingId?: string;
        title: string;
        price: number;
        photos?: Array<{ url: string; alt: string }>;
      };
  buyerId:
    | string
    | {
        _id: string;
        name?: string;
        first_name?: string;
        last_name?: string;
        email: string;
      };
  sellerId:
    | string
    | {
        _id: string;
        name?: string;
        first_name?: string;
        last_name?: string;
        email: string;
      };
  lastMessageAt: string;
  createdAt: string;
  listing?: {
    _id: string;
    listingId?: string;
    title: string;
    price: number;
    photos?: Array<{ url: string; alt: string }>;
  };
  buyer?: {
    _id: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    email: string;
  };
  seller?: {
    _id: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    email: string;
  };
}

interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  sender?: {
    _id: string;
    name: string;
    email: string;
  };
}

interface MessagesProps {
  onNavigate?: (view: string) => void; // Optional now since we use Navbar
  initialConversationId?: string;
}

export const Messages: React.FC<MessagesProps> = ({
  initialConversationId,
}) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load conversations on component mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Select initial conversation
  useEffect(() => {
    if (conversations.length === 0) return;

    // If we have an initialConversationId (from Contact Seller), find that specific conversation
    if (initialConversationId) {
      const targetConv = conversations.find(
        (c) => c._id === initialConversationId
      );
      if (targetConv) {
        setSelectedConversation(targetConv);
      }
    } else {
      // If no specific conversation (from navbar), don't auto-select any conversation
      // Let the user choose from the sidebar
      setSelectedConversation(null);
    }
  }, [conversations, initialConversationId]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation._id);
    }
  }, [selectedConversation]);

  // If we have an initialConversationId but no conversations loaded yet,
  // create a temporary conversation object to show the chat interface
  useEffect(() => {
    if (initialConversationId && conversations.length === 0 && !loading) {
      // Create a temporary conversation object for the new chat
      const tempConversation: Conversation = {
        _id: initialConversationId,
        listingId: "", // Will be populated when we get the actual conversation
        buyerId: user?.id || "",
        sellerId: "",
        lastMessageAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        listing: {
          _id: "",
          title: "New Conversation",
          price: 0,
        },
        buyer: {
          _id: user?.id || "",
          first_name: user?.first_name || "",
          last_name: user?.last_name || "",
          email: user?.email || "",
        },
        seller: {
          _id: "",
          first_name: "Unknown",
          last_name: "",
          email: "",
        },
      };
      setSelectedConversation(tempConversation);
    }
  }, [initialConversationId, conversations.length, loading, user]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/chats/");
      // console.log("Frontend - conversations response:", response.data);
      // console.log(
      //   "Frontend - conversations count:",
      //   response.data.conversations?.length
      // );
      // if (response.data.conversations?.length > 0) {
      //   console.log('Frontend - first conversation:', JSON.stringify(response.data.conversations[0], null, 2));
      // }
      setConversations(response.data.conversations || []);
    } catch (err) {
      console.error("Error loading conversations:", err);
      setError("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await api.get(`/api/chats/${conversationId}/messages`);
      setMessages(response.data.messages || []);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error("Error loading messages:", err);
      // Don't show error for new conversations that might not have messages yet
      if (messages.length === 0) {
        setMessages([]); // Just show empty messages
        setError(null);
      } else {
        setError("Failed to load messages");
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    try {
      const response = await api.post(
        `/api/chats/${selectedConversation._id}/messages`,
        {
          body: newMessage.trim(),
        }
      );

      // Add the new message to the local state
      setMessages((prev) => [...prev, response.data.message]);

      // Update conversation last message time
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c._id === selectedConversation._id
            ? { ...c, lastMessageAt: new Date().toISOString() }
            : c
        );
        return updated.sort(
          (a, b) =>
            new Date(b.lastMessageAt).getTime() -
            new Date(a.lastMessageAt).getTime()
        );
      });

      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  };

  const getOtherPartyName = (conv: Conversation) => {
    // Handle the case where buyerId and sellerId are populated objects
    const userId = String(user?.id);
    let buyerId: string;
    let sellerId: string;

    // Check if buyerId is an object (populated) or string (ID)
    if (typeof conv.buyerId === "object" && conv.buyerId !== null) {
      buyerId = String(conv.buyerId._id);
    } else {
      buyerId = String(conv.buyerId);
    }

    // Check if sellerId is an object (populated) or string (ID)
    if (typeof conv.sellerId === "object" && conv.sellerId !== null) {
      sellerId = String(conv.sellerId._id);
    } else {
      sellerId = String(conv.sellerId);
    }

    if (buyerId === userId) {
      // Current user is the buyer, so show seller name

      // Try to get seller data from populated sellerId first, then fall back to conv.seller
      let sellerData;
      if (typeof conv.sellerId === "object" && conv.sellerId !== null) {
        sellerData = conv.sellerId;
      } else {
        sellerData = conv.seller;
      }

      if (sellerData?.first_name && sellerData?.last_name) {
        const name = `${sellerData.first_name} ${sellerData.last_name}`;
        return name;
      }
      return sellerData?.name || "Unknown";
    } else if (sellerId === userId) {
      // Current user is the seller, so show buyer name

      // Try to get buyer data from populated buyerId first, then fall back to conv.buyer
      let buyerData;
      if (typeof conv.buyerId === "object" && conv.buyerId !== null) {
        buyerData = conv.buyerId;
      } else {
        buyerData = conv.buyer;
      }

      if (buyerData?.first_name && buyerData?.last_name) {
        const name = `${buyerData.first_name} ${buyerData.last_name}`;
        return name;
      }
      return buyerData?.name || "Unknown";
    } else {
      return "Unknown";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h2 className="text-3xl font-semibold text-gray-900 mb-8">Messages</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-240px)]">
          <div className="col-span-4 bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Conversations
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>No conversations yet</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const otherPartyName = getOtherPartyName(conv);
                  return (
                    <button
                      key={conv._id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full p-5 border-b border-gray-100 hover:bg-gray-50 text-left transition-colors ${
                        selectedConversation?._id === conv._id
                          ? "bg-gray-50"
                          : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-semibold flex-shrink-0">
                          {otherPartyName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between mb-1">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {otherPartyName}
                            </h4>
                            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                              {formatDate(conv.lastMessageAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {(() => {
                              // Handle both populated listingId and separate listing field
                              let listingData;
                              if (
                                typeof conv.listingId === "object" &&
                                conv.listingId !== null
                              ) {
                                listingData = conv.listingId;
                              } else {
                                listingData = conv.listing;
                              }
                              return listingData
                                ? `${listingData.title} - $${listingData.price}`
                                : "Unknown listing";
                            })()}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="col-span-8 bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
            {selectedConversation ? (
              <>
                <div className="p-5 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-semibold">
                      {getOtherPartyName(selectedConversation)
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {getOtherPartyName(selectedConversation)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {(() => {
                          // Handle both populated listingId and separate listing field
                          let listingData;
                          if (
                            typeof selectedConversation.listingId ===
                              "object" &&
                            selectedConversation.listingId !== null
                          ) {
                            listingData = selectedConversation.listingId;
                          } else {
                            listingData = selectedConversation.listing;
                          }
                          return listingData
                            ? `${listingData.title} - $${listingData.price}`
                            : "Unknown listing";
                        })()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-500">
                        <p className="text-lg font-medium mb-2">
                          Start the conversation!
                        </p>
                        <p className="text-sm">
                          Send a message to begin chatting with the seller.
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isCurrentUser = message.senderId === user?.id;
                      // Check if this is a warning message (starts with warning emoji or contains "WARNING")
                      const isWarningMessage = message.body.includes("⚠️") || message.body.toUpperCase().includes("WARNING");
                      
                      // Get listing data from conversation
                      let listingData;
                      if (
                        typeof selectedConversation.listingId === "object" &&
                        selectedConversation.listingId !== null
                      ) {
                        listingData = selectedConversation.listingId;
                      } else {
                        listingData = selectedConversation.listing;
                      }

                      // Get the listing ID - prefer _id (MongoDB ObjectId) or custom listingId
                      let listingIdForPreview: string = "";
                      if (listingData && typeof listingData === "object") {
                        listingIdForPreview = listingData._id || listingData.listingId || "";
                      } else if (typeof selectedConversation.listingId === "string") {
                        listingIdForPreview = selectedConversation.listingId;
                      } else if (selectedConversation.listingId && typeof selectedConversation.listingId === "object") {
                        listingIdForPreview = selectedConversation.listingId._id || selectedConversation.listingId.listingId || "";
                      }

                      return (
                        <div
                          key={message._id}
                          className={`flex ${
                            isCurrentUser ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[70%] ${isCurrentUser ? "" : ""}`}
                          >
                            <div
                              className={`px-4 py-3 rounded-2xl ${
                                isCurrentUser
                                  ? "bg-gray-100 text-gray-900"
                                  : "bg-gray-100 text-gray-900"
                              }`}
                            >
                              <p className="text-sm leading-relaxed">
                                {message.body}
                              </p>
                              
                              {/* Show listing preview for warning messages with listing info */}
                              {isWarningMessage && listingData && typeof listingData === "object" && listingIdForPreview && (
                                <ListingPreview
                                  listingId={listingIdForPreview}
                                  listingTitle={listingData.title}
                                  listingPrice={listingData.price}
                                  listingImage={listingData.photos?.[0]?.url}
                                />
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1 px-2">
                              {formatTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-5 border-t border-gray-200">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-3 bg-gray-100 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-black text-white p-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <p>Select a conversation to start messaging</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;

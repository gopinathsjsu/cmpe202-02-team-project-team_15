import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, AlertTriangle, ChevronDown, ChevronRight, ArrowLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { ListingPreview } from "./ListingPreview";
import api from "../services/api";
import { Avatar } from "./Avatar";

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
  unreadCount?: number;
}

interface Message {
  _id: string;
  conversationId: string;
  senderId: string | {
    _id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    photoUrl?: string;
    photo_url?: string;
  };
  body: string;
  senderProfileImage?: string | null;
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
  const { showError } = useToast();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminConversationsExpanded, setAdminConversationsExpanded] = useState(true);

  // Load conversations on component mount
  useEffect(() => {
    loadConversations({ showLoading: true });
  }, []);

  // Keep selected conversation in sync or select initial conversation
  useEffect(() => {
    if (conversations.length === 0) return;

    if (selectedConversation) {
      const updated = conversations.find(
        (c) => c._id === selectedConversation._id
      );
      if (updated && updated !== selectedConversation) {
        setSelectedConversation(updated);
      }
      return;
    }

    if (initialConversationId) {
      const targetConv = conversations.find(
        (c) => c._id === initialConversationId
      );
      if (targetConv) {
        setSelectedConversation(targetConv);
        return;
      }
    }
  }, [conversations, initialConversationId, selectedConversation]);

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

  const loadConversations = async ({
    activeConversationId,
    showLoading = false,
  }: {
    activeConversationId?: string;
    showLoading?: boolean;
  } = {}) => {
    try {
      if (showLoading) setLoading(true);
      const response = await api.get("/api/chats/");
      const conversationData: Conversation[] =
        response.data.conversations || [];
      setConversations(conversationData);

      const totalUnread = conversationData.reduce(
        (sum, conv) => sum + (conv.unreadCount || 0),
        0
      );
      window.dispatchEvent(
        new CustomEvent("messages:unread-count", { detail: totalUnread })
      );

      if (activeConversationId) {
        const updated = conversationData.find(
          (c) => c._id === activeConversationId
        );
        if (updated) {
          setSelectedConversation(updated);
        }
      }
    } catch (err) {
      console.error("Error loading conversations:", err);
      showError("Load Failed", "Failed to load conversations");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await api.get(`/api/chats/${conversationId}/messages`);
      setMessages(response.data.messages || []);

      // Mark conversation as read locally
      setConversations((prev) => {
        const updated = prev.map((conv) =>
          conv._id === conversationId ? { ...conv, unreadCount: 0 } : conv
        );
        const totalUnread = updated.reduce(
          (sum, conv) => sum + (conv.unreadCount || 0),
          0
        );
        window.dispatchEvent(
          new CustomEvent("messages:unread-count", { detail: totalUnread })
        );
        return updated;
      });
    } catch (err) {
      console.error("Error loading messages:", err);
      // Don't show error for new conversations that might not have messages yet
      if (messages.length === 0) {
        setMessages([]); // Just show empty messages
      } else {
        showError("Load Failed", "Failed to load messages");
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
        const updated = prev
          .map((c) =>
            c._id === selectedConversation._id
              ? {
                  ...c,
                  lastMessageAt: new Date().toISOString(),
                  unreadCount: 0,
                }
              : c
          )
          .sort(
            (a, b) =>
              new Date(b.lastMessageAt).getTime() -
              new Date(a.lastMessageAt).getTime()
          );
        const totalUnread = updated.reduce(
          (sum, conv) => sum + (conv.unreadCount || 0),
          0
        );
        window.dispatchEvent(
          new CustomEvent("messages:unread-count", { detail: totalUnread })
        );
        return updated;
      });
      setNewMessage("");
    } catch (err: any) {
      console.error("Error sending message:", err);
      showError("Send Failed", err.response?.data?.message || "Failed to send message");
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

  // Helper function to check if conversation is from admin
  const isAdminConversation = (conv: Conversation): boolean => {
    const userId = String(user?.id);
    let sellerId: string;

    // Check if sellerId is an object (populated) or string (ID)
    if (typeof conv.sellerId === "object" && conv.sellerId !== null) {
      sellerId = String(conv.sellerId._id);
    } else {
      sellerId = String(conv.sellerId);
    }

    // If current user is the seller, check if buyer is admin
    // Admin sends warnings, so admin is always the buyerId in warning conversations
    if (sellerId === userId) {
      let buyerData;
      if (typeof conv.buyerId === "object" && conv.buyerId !== null) {
        buyerData = conv.buyerId;
      } else {
        buyerData = conv.buyer;
      }
      
      // Check if buyer has admin in name or email, or check if buyer email contains admin
      const buyerName = buyerData?.first_name || buyerData?.name || "";
      const buyerLastName = buyerData?.last_name || "";
      const buyerEmail = buyerData?.email || "";
      const fullName = `${buyerName} ${buyerLastName}`.toLowerCase();
      
      return fullName.includes("admin") || 
             buyerEmail.toLowerCase().includes("admin") ||
             buyerName.toLowerCase() === "admin";
    }
    
    return false;
  };

  const getListingInfo = (
    conv: Conversation | null
  ): { id: string; title: string; price: number; image?: string } | null => {
    if (!conv) return null;

    let listingData;
    if (typeof conv.listingId === "object" && conv.listingId !== null) {
      listingData = conv.listingId;
    } else {
      listingData = conv.listing;
    }

    if (!listingData) return null;

    let listingIdValue: string | undefined;
    if (typeof conv.listingId === "string") {
      listingIdValue = conv.listingId;
    } else if (listingData?._id) {
      listingIdValue = String(listingData._id);
    } else if (listingData?.listingId) {
      listingIdValue = listingData.listingId;
    }

    if (!listingIdValue || !listingData?.title || listingData?.price === undefined) {
      return null;
    }

    const image = listingData?.photos?.length
      ? listingData.photos[0]?.url
      : undefined;

    return {
      id: listingIdValue,
      title: listingData.title,
      price: listingData.price,
      image,
    };
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

  // Get the other party's user ID for navigation to their profile
  const getOtherPartyId = (conv: Conversation): string | null => {
    const userId = String(user?.id);
    let buyerId: string;
    let sellerId: string;

    if (typeof conv.buyerId === "object" && conv.buyerId !== null) {
      buyerId = String(conv.buyerId._id);
    } else {
      buyerId = String(conv.buyerId);
    }

    if (typeof conv.sellerId === "object" && conv.sellerId !== null) {
      sellerId = String(conv.sellerId._id);
    } else {
      sellerId = String(conv.sellerId);
    }

    if (buyerId === userId) {
      // Current user is buyer, return seller ID
      return sellerId;
    } else if (sellerId === userId) {
      // Current user is seller, return buyer ID
      return buyerId;
    }
    return null;
  };

  const selectedListingInfo = getListingInfo(selectedConversation);
  const showListingPreview =
    selectedConversation &&
    selectedListingInfo &&
    !isAdminConversation(selectedConversation);

  // State to track if we're viewing a conversation on mobile
  const [showMobileChat, setShowMobileChat] = useState(false);

  // When a conversation is selected on mobile, show the chat view
  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setShowMobileChat(true);
  };

  // Go back to conversation list on mobile
  const handleBackToList = () => {
    setShowMobileChat(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="h-full flex flex-col">
          {/* Header - hide on mobile when viewing chat */}
          <div className={`mb-4 sm:mb-6 ${showMobileChat ? 'hidden sm:block' : ''}`}>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Messages</h1>
          </div>

          {/* Main container - responsive layout */}
          <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-4 sm:gap-6 min-h-0 h-[calc(100vh-180px)] sm:h-[calc(100vh-240px)]">
            {/* Conversations List - full width on mobile, hidden when chat is open */}
            <div className={`${showMobileChat ? 'hidden' : 'flex'} lg:flex lg:col-span-4 w-full bg-white rounded-2xl border border-gray-200 overflow-hidden flex-col flex-1 lg:flex-none`}>
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
              ) : (() => {
                // Separate admin and regular conversations
                const adminConvs = conversations.filter(isAdminConversation);
                const regularConvs = conversations.filter(conv => !isAdminConversation(conv));
                
                return (
                  <>
                    {/* Regular Conversations */}
                    {regularConvs.length > 0 && (
                      <div>
                        {regularConvs.map((conv) => {
                          const otherPartyName = getOtherPartyName(conv);
                          const hasUnread = (conv.unreadCount || 0) > 0;
                          return (
                            <button
                              key={conv._id}
                              onClick={() => handleSelectConversation(conv)}
                              className={`w-full p-4 sm:p-5 border-b border-gray-100 hover:bg-gray-50 text-left transition-colors ${
                                selectedConversation?._id === conv._id ? "bg-gray-50" : ""
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {(() => {
                                  // Determine the other party's data
                                  const userId = String(user?.id);
                                  const buyerId = typeof conv.buyerId === "object" ? String(conv.buyerId._id) : String(conv.buyerId);
                                  const sellerId = typeof conv.sellerId === "object" ? String(conv.sellerId._id) : String(conv.sellerId);
                                  
                                  let otherParty: any = null;
                                  if (buyerId === userId) {
                                    otherParty = typeof conv.sellerId === "object" ? conv.sellerId : conv.seller;
                                  } else if (sellerId === userId) {
                                    otherParty = typeof conv.buyerId === "object" ? conv.buyerId : conv.buyer;
                                  }
                                  
                                  return (
                                    <Avatar
                                      photoUrl={otherParty?.photoUrl || otherParty?.photo_url}
                                      firstName={otherParty?.first_name}
                                      lastName={otherParty?.last_name}
                                      email={otherParty?.email}
                                      size={40}
                                      className={`flex-shrink-0 ${hasUnread ? "ring-2 ring-blue-500" : ""}`}
                                    />
                                  );
                                })()}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-baseline justify-between mb-1">
                                    <h4
                                      className={`truncate ${
                                        hasUnread
                                          ? "font-semibold text-gray-900"
                                          : "font-medium text-gray-900"
                                      }`}
                                    >
                                      {otherPartyName}
                                    </h4>
                                    <div className="flex items-center gap-2 ml-2">
                                      {hasUnread && (
                                        <span className="text-xs font-semibold text-white bg-blue-600 px-2 py-0.5 rounded-full">
                                          {Math.min(conv.unreadCount || 0, 99)}
                                        </span>
                                      )}
                                      <span className="text-xs text-gray-500 flex-shrink-0">
                                        {formatDate(conv.lastMessageAt)}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-600 truncate">
                                    {(() => {
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
                        })}
                      </div>
                    )}

                    {/* Admin Conversations - Grouped */}
                    {adminConvs.length > 0 && (
                      <div className="border-t border-gray-200">
                        <button
                          onClick={() => setAdminConversationsExpanded(!adminConversationsExpanded)}
                          className="w-full px-5 py-3 bg-yellow-50 hover:bg-yellow-100 border-b border-yellow-200 flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            <span className="font-semibold text-gray-900">
                              Admin Warnings
                            </span>
                            <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">
                              {adminConvs.length}
                            </span>
                          </div>
                          {adminConversationsExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                          )}
                        </button>
                        
                        {adminConversationsExpanded && (
                          <div>
                            {adminConvs.map((conv) => {
                              const hasUnread = (conv.unreadCount || 0) > 0;
                              // Get listing info for display
                              let listingData;
                              if (
                                typeof conv.listingId === "object" &&
                                conv.listingId !== null
                              ) {
                                listingData = conv.listingId;
                              } else {
                                listingData = conv.listing;
                              }
                              
                              return (
                                <button
                                  key={conv._id}
                                  onClick={() => handleSelectConversation(conv)}
                                  className={`w-full p-3 sm:p-4 pl-5 sm:pl-7 border-b border-gray-100 hover:bg-yellow-50 text-left transition-colors ${
                                    selectedConversation?._id === conv._id ? "bg-yellow-50" : ""
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                        hasUnread
                                          ? "bg-yellow-300 text-yellow-900"
                                          : "bg-yellow-200 text-yellow-800"
                                      }`}
                                    >
                                      <AlertTriangle className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-baseline justify-between mb-1">
                                        <h4
                                          className={`truncate text-sm ${
                                            hasUnread
                                              ? "font-semibold text-gray-900"
                                              : "font-medium text-gray-900"
                                          }`}
                                        >
                                          {listingData?.title || "Warning"}
                                        </h4>
                                        <div className="flex items-center gap-2 ml-2">
                                          {hasUnread && (
                                            <span className="text-xs font-semibold text-yellow-900 bg-yellow-300 px-2 py-0.5 rounded-full">
                                              {Math.min(conv.unreadCount || 0, 99)}
                                            </span>
                                          )}
                                          <span className="text-xs text-gray-500 flex-shrink-0">
                                            {formatDate(conv.lastMessageAt)}
                                          </span>
                                        </div>
                                      </div>
                                      <p className="text-xs text-gray-600 truncate">
                                        {listingData ? `$${listingData.price}` : "Admin message"}
                                      </p>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          {/* Chat Panel - full width on mobile when open, always on desktop */}
          <div className={`${showMobileChat ? 'flex' : 'hidden'} lg:flex lg:col-span-8 w-full bg-white rounded-2xl border border-gray-200 overflow-hidden flex-col flex-1 lg:flex-none`}>
            {selectedConversation ? (
              <>
                <div className="p-3 sm:p-5 border-b border-gray-200">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Back button - only on mobile */}
                    <button
                      onClick={handleBackToList}
                      className="lg:hidden p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="Back to conversations"
                    >
                      <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    {(() => {
                      // Get the other party's data for the avatar
                      const userId = String(user?.id);
                      const buyerId = typeof selectedConversation.buyerId === "object" 
                        ? String(selectedConversation.buyerId._id) 
                        : String(selectedConversation.buyerId);
                      const sellerId = typeof selectedConversation.sellerId === "object" 
                        ? String(selectedConversation.sellerId._id) 
                        : String(selectedConversation.sellerId);
                      
                      let otherParty: any = null;
                      if (buyerId === userId) {
                        // Current user is buyer, show seller
                        otherParty = typeof selectedConversation.sellerId === "object" 
                          ? selectedConversation.sellerId 
                          : selectedConversation.seller;
                      } else if (sellerId === userId) {
                        // Current user is seller, show buyer
                        otherParty = typeof selectedConversation.buyerId === "object" 
                          ? selectedConversation.buyerId 
                          : selectedConversation.buyer;
                      }
                      
                      return (
                        <Avatar
                          photoUrl={otherParty?.photoUrl || otherParty?.photo_url}
                          firstName={otherParty?.first_name}
                          lastName={otherParty?.last_name}
                          email={otherParty?.email}
                          size={40}
                          className="flex-shrink-0"
                        />
                      );
                    })()}
                    <div>
                      <h3 
                        className="font-semibold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors"
                        onClick={() => {
                          const otherPartyId = getOtherPartyId(selectedConversation);
                          if (otherPartyId) {
                            navigate(`/profile/${otherPartyId}`);
                          }
                        }}
                      >
                        {getOtherPartyName(selectedConversation)}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 truncate max-w-[200px] sm:max-w-none">
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

                {showListingPreview && selectedListingInfo && (
                  <div className="px-4 sm:px-6 pt-3 sm:pt-4">
                    <ListingPreview
                      listingId={selectedListingInfo.id}
                      listingTitle={selectedListingInfo.title}
                      listingPrice={selectedListingInfo.price}
                      listingImage={selectedListingInfo.image}
                    />
                  </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
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
                      // Handle senderId as string or populated object
                      const senderIdStr = typeof message.senderId === "string" 
                        ? message.senderId 
                        : message.senderId._id;
                      const isCurrentUser = senderIdStr === user?.id;
                      
                      // Get sender profile image
                      let senderProfileImage = message.senderProfileImage || null;
                      
                      if (typeof message.senderId === "object") {
                        // Use senderProfileImage from message, or fallback to senderId photoUrl
                        if (!senderProfileImage) {
                          senderProfileImage = message.senderId.photoUrl || message.senderId.photo_url || null;
                        }
                      } else {
                        // If senderId is just a string, for current user, use their photoUrl
                        if (isCurrentUser) {
                          senderProfileImage = user?.photoUrl || user?.photo_url || null;
                        }
                      }
                      
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
                          className={`flex items-end gap-1.5 sm:gap-2 ${
                            isCurrentUser ? "justify-end" : "justify-start"
                          }`}
                        >
                          {/* Avatar - only show for other users (left side) */}
                          {!isCurrentUser && (
                            <div className="flex-shrink-0">
                              <Avatar
                                photoUrl={senderProfileImage}
                                firstName={typeof message.senderId === 'object' ? message.senderId.first_name : undefined}
                                lastName={typeof message.senderId === 'object' ? message.senderId.last_name : undefined}
                                email={typeof message.senderId === 'object' ? message.senderId.email : undefined}
                                size={32}
                                className="flex-shrink-0"
                              />
                            </div>
                          )}
                          
                          <div className={`max-w-[85%] sm:max-w-[70%] ${isCurrentUser ? "" : ""}`}>
                            <div
                              className={`px-3 sm:px-4 py-2 sm:py-3 rounded-2xl ${
                                isCurrentUser
                                  ? "bg-gray-100 text-gray-900"
                                  : "bg-gray-100 text-gray-900"
                              }`}
                            >
                              <p className="text-sm leading-relaxed break-words">
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
                          
                          {/* Avatar - only show for current user (right side) */}
                          {isCurrentUser && (
                            <div className="flex-shrink-0">
                              <Avatar
                                photoUrl={senderProfileImage}
                                firstName={user?.first_name}
                                lastName={user?.last_name}
                                email={user?.email}
                                size={32}
                                className="flex-shrink-0"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="p-3 sm:p-5 border-t border-gray-200">
                  <div className="flex gap-2 sm:gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-100 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-black text-white p-2.5 sm:p-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 p-4">
                <p className="text-center">Select a conversation to start messaging</p>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Messages;

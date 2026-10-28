import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Calendar,
  CreditCard,
  Star,
  Settings,
  Search,
  ChevronRight,
  ChevronLeft,
  FileText,
  User,
  CheckCheck,
  CheckCircle,
  Clock,
  Sparkles
} from "lucide-react";
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead
} from "@/store/slices/notificationsSlice";
import type { RootState, AppDispatch } from "@/store";

// Luxury clinic background
import NotificationsBg from "@/assets/notifications_bg.png";
import { formatDateTime } from "@/utils/formatters";

export interface ClientNotificationItem {
  id: string;
  type: "appointments" | "account" | "payments" | "reviews" | "system";
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  link?: string;
}

// Fallback high-end notifications matching the design mockup 1:1
const DEFAULT_MOCKUP_NOTIFICATIONS: ClientNotificationItem[] = [
  {
    id: "notif-1",
    type: "appointments",
    title: "Appointment Reminder",
    message: "Your appointment with Dr. Papadopoulos is tomorrow at 11:00.",
    createdAt: "2 hours ago",
    isRead: false,
    link: "/appointments"
  },
  {
    id: "notif-2",
    type: "appointments",
    title: "Booking Confirmed",
    message: "Your appointment on 12 Apr 2024 at 10:30 has been confirmed.",
    createdAt: "1 day ago",
    isRead: true,
    link: "/appointments"
  },
  {
    id: "notif-3",
    type: "payments",
    title: "Payment Receipt",
    message: "Your payment of €120.00 for HydraFacial® has been completed.",
    createdAt: "3 days ago",
    isRead: true,
    link: "/payments"
  },
  {
    id: "notif-4",
    type: "reviews",
    title: "Share Your Experience",
    message: "How was your treatment? Leave a review and help others.",
    createdAt: "5 days ago",
    isRead: true,
    link: "/reviews"
  },
  {
    id: "notif-5",
    type: "account",
    title: "Account Updated",
    message: "Your personal details have been successfully updated.",
    createdAt: "1 week ago",
    isRead: true,
    link: "/personal-details"
  },
  {
    id: "notif-6",
    type: "appointments",
    title: "Aftercare Guidelines Available",
    message: "Clinical post-procedure recommendations have been added to your diary.",
    createdAt: "1 week ago",
    isRead: true,
    link: "/appointments"
  },
  {
    id: "notif-7",
    type: "payments",
    title: "Invoice #INV-2024-041",
    message: "Official tax invoice for aesthetic consultation is ready for download.",
    createdAt: "2 weeks ago",
    isRead: true,
    link: "/payments"
  },
  {
    id: "notif-8",
    type: "account",
    title: "Security Verification",
    message: "Your contact preferences and phone verification were confirmed.",
    createdAt: "3 weeks ago",
    isRead: true,
    link: "/settings"
  },
  {
    id: "notif-9",
    type: "appointments",
    title: "Pre-Treatment Preparation Notice",
    message: "Please avoid direct UV sunlight and retinoids 48 hours before your laser session.",
    createdAt: "3 weeks ago",
    isRead: true,
    link: "/appointments"
  },
  {
    id: "notif-10",
    type: "payments",
    title: "Deposit Received",
    message: "Your €50.00 reservation deposit for Laser Hair Removal course was received.",
    createdAt: "4 weeks ago",
    isRead: true,
    link: "/payments"
  },
  {
    id: "notif-11",
    type: "reviews",
    title: "Loyalty Points Awarded",
    message: "+50 beauty credits have been credited to your wallet for reviewing your Botox consultation.",
    createdAt: "1 month ago",
    isRead: true,
    link: "/reviews"
  },
  {
    id: "notif-12",
    type: "system",
    title: "Platform Maintenance",
    message: "System core updates completed smoothly with enhanced booking security.",
    createdAt: "1 month ago",
    isRead: true
  },
  {
    id: "notif-13",
    type: "appointments",
    title: "Clinical Follow-up Assessment",
    message: "Dr. Papadopoulos invited you to complete your 14-day recovery questionnaire.",
    createdAt: "1 month ago",
    isRead: true,
    link: "/appointments"
  },
  {
    id: "notif-14",
    type: "account",
    title: "VIP Tier Activated",
    message: "Congratulations! You have reached Silver Tier with complimentary clinic perks.",
    createdAt: "2 months ago",
    isRead: true,
    link: "/my-account"
  },
  {
    id: "notif-15",
    type: "payments",
    title: "Package Balance Updated",
    message: "4 sessions remaining in your 6-session Dermal Infusion package.",
    createdAt: "2 months ago",
    isRead: true,
    link: "/payments"
  },
  {
    id: "notif-16",
    type: "system",
    title: "Glyfada Branch Grand Opening",
    message: "New clinic location in Glyfada is now open for bookings and consultations.",
    createdAt: "2 months ago",
    isRead: true
  }
];

export const ClientNotifications: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { notifications: rawNotifications, isLoading } = useSelector(
    (state: RootState) => state.notifications
  );

  const [isGreek, setIsGreek] = useState<boolean>(
    () => typeof window !== "undefined" && localStorage.getItem("preferredLang") === "el"
  );

  useEffect(() => {
    const handleLang = () => {
      setIsGreek(localStorage.getItem("preferredLang") === "el");
    };
    window.addEventListener("storage", handleLang);
    return () => window.removeEventListener("storage", handleLang);
  }, []);

  useEffect(() => {
    dispatch(fetchNotifications(50));
  }, [dispatch]);

  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "unread">("newest");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);

  // Format notifications or fallback to mockups if empty
  const allNotifications: ClientNotificationItem[] = useMemo(() => {
    if (rawNotifications && rawNotifications.length > 0) {
      return rawNotifications.map((n: any) => {
        const typeRaw = (n.data?.type || n.type || "system").toLowerCase();
        let catType: ClientNotificationItem["type"] = "system";
        if (typeRaw.includes("appointment") || typeRaw.includes("booking")) catType = "appointments";
        else if (typeRaw.includes("payment") || typeRaw.includes("invoice") || typeRaw.includes("receipt")) catType = "payments";
        else if (typeRaw.includes("review") || typeRaw.includes("feedback")) catType = "reviews";
        else if (typeRaw.includes("account") || typeRaw.includes("user") || typeRaw.includes("profile")) catType = "account";

        return {
          id: n.id,
          type: catType,
          title: n.title || "Notification",
          message: n.message || n.body || "",
          createdAt: n.createdAt ? formatDateTime(n.createdAt) : "Recently",
          isRead: !!n.isRead,
          link: n.data?.link || (catType === "appointments" ? "/appointments" : undefined)
        };
      });
    }
    return DEFAULT_MOCKUP_NOTIFICATIONS;
  }, [rawNotifications]);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchTerm, sortOrder]);

  // Counts by category
  const counts = useMemo(() => {
    const res: Record<string, number> = {
      all: allNotifications.length,
      appointments: 0,
      account: 0,
      payments: 0,
      reviews: 0,
      system: 0
    };
    allNotifications.forEach((item) => {
      if (res[item.type] !== undefined) {
        res[item.type]++;
      }
    });
    return res;
  }, [allNotifications]);

  const unreadCount = useMemo(() => {
    return allNotifications.filter((n) => !n.isRead).length;
  }, [allNotifications]);

  // Filtered & Sorted items
  const filteredNotifications = useMemo(() => {
    let list = allNotifications.filter((n) => {
      if (activeFilter !== "ALL" && n.type.toUpperCase() !== activeFilter.toUpperCase()) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q)
        );
      }
      return true;
    });

    if (sortOrder === "unread") {
      list = [...list].sort((a, b) => (a.isRead === b.isRead ? 0 : a.isRead ? 1 : -1));
    }

    return list;
  }, [allNotifications, activeFilter, searchTerm, sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage) || 1;
  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredNotifications.slice(start, start + itemsPerPage);
  }, [filteredNotifications, currentPage, itemsPerPage]);

  const handleNotificationClick = (item: ClientNotificationItem) => {
    if (!item.isRead) {
      dispatch(markAsRead(item.id));
    }
    if (item.link) {
      navigate(item.link);
    }
  };

  const getNotificationIcon = (type: ClientNotificationItem["type"]) => {
    switch (type) {
      case "appointments":
        return (
          <div className="size-11 sm:size-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 shadow-2xs">
            <Calendar className="size-5" />
          </div>
        );
      case "payments":
        return (
          <div className="size-11 sm:size-12 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 shadow-2xs">
            <CreditCard className="size-5" />
          </div>
        );
      case "reviews":
        return (
          <div className="size-11 sm:size-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0 shadow-2xs">
            <Star className="size-5" />
          </div>
        );
      case "account":
        return (
          <div className="size-11 sm:size-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
            <User className="size-5" />
          </div>
        );
      case "system":
      default:
        return (
          <div className="size-11 sm:size-12 rounded-2xl bg-gray-100 text-gray-600 border border-gray-200 flex items-center justify-center shrink-0 shadow-2xs">
            <Settings className="size-5" />
          </div>
        );
    }
  };

  const filterTabs = [
    { key: "ALL", label: isGreek ? "ΟΛΕΣ" : "ALL" },
    { key: "APPOINTMENTS", label: isGreek ? "ΡΑΝΤΕΒΟΥ" : "APPOINTMENTS" },
    { key: "ACCOUNT", label: isGreek ? "ΛΟΓΑΡΙΑΣΜΟΣ" : "ACCOUNT" },
    { key: "PAYMENTS", label: isGreek ? "ΠΛΗΡΩΜΕΣ" : "PAYMENTS" },
    { key: "REVIEWS", label: isGreek ? "ΑΞΙΟΛΟΓΗΣΕΙΣ" : "REVIEWS" },
    { key: "SYSTEM", label: isGreek ? "ΣΥΣΤΗΜΑ" : "SYSTEM" }
  ];

  return (
    <div className="min-h-screen relative bg-[#F8FAFC] overflow-x-hidden flex flex-col justify-between">
      {/* Background Hero Banner - 100% Crisp, unblurred aesthetic clinic visual */}
      <div className="absolute top-0 inset-x-0 h-[880px] sm:h-[1000px] lg:h-[1150px] z-0 pointer-events-none overflow-hidden">
        <img
          src={NotificationsBg}
          className="w-full h-full object-cover"
          style={{ objectPosition: 'center 38%', filter: "none", imageRendering: "auto" }}
          alt="Luxury Clinic Lounge"
        />
        {/* Soft Ambient Left Gradient behind text so typography is 100% readable while the clinic room remains fully visible */}
        <div className="absolute inset-y-0 left-0 w-full sm:w-2/3 max-w-2xl bg-gradient-to-r from-white/45 via-white/15 to-transparent pointer-events-none" />
        {/* Soft bottom blend to transition smoothly into page base */}
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/60 to-transparent pointer-events-none" />
      </div>

      <div className="relative z-10 max-w-[1400px] w-full mx-auto px-4 sm:px-8 pt-8 sm:pt-14 pb-24">
        {/* Page Title & Subtitle */}
        <div className="mb-8 sm:mb-10">
          {/* Floating Glass Breadcrumb Pill */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/40 backdrop-blur-md border border-white/60 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] shadow-sm mb-4"
          >
            <span className="text-gray-900 border-b border-gray-900/30 pb-0.5">
              BEAUTY DOCTORS
            </span>
            <ChevronRight size={12} className="text-[#84cc16]" />
            <span className="text-[#84cc16] font-extrabold">
              {isGreek ? "ΕΙΔΟΠΟΙΗΣΕΙΣ" : "NOTIFICATIONS"}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-gray-900 leading-none drop-shadow-sm"
          >
            {isGreek ? "ΕΙΔΟΠΟΙΗΣΕΙΣ" : <>ACTIVITY <span className="text-[#84cc16] sm:text-[#a3e635]">NOTIFICATIONS</span></>}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-gray-600 mt-3 sm:mt-4 font-bold text-xs sm:text-sm md:text-base max-w-2xl leading-relaxed"
          >
            {isGreek
              ? "Λάβετε ειδοποιήσεις για ραντεβού, λογαριασμό και υπηρεσίες."
              : "Receive appointment updates, account security notifications and service alerts."}
          </motion.p>
        </div>

        {/* 2-Column Grid with Transparent Frosted Glass Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Left Column: Filter Sidebar (4 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="lg:col-span-4 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-[32px] p-6 border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.03)] transition-all duration-300"
          >
            {/* Search Input */}
            <div className="relative mb-5">
              <Search size={15} className="text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isGreek ? "Αναζήτηση ειδοποιήσεων..." : "Search notifications..."}
                className="w-full bg-white/35 border border-white/50 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#CBFF38] focus:bg-white/60 transition-all shadow-xs backdrop-blur-sm"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5 mb-6">
              {filterTabs.map((tab) => {
                const isActive = activeFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#CBFF38] text-black shadow-sm scale-105"
                        : "text-gray-600 hover:text-gray-900 bg-white/25 hover:bg-white/45 border border-white/45"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Notification Type Section */}
            <div className="pt-4 border-t border-gray-200/50">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.18em] mb-4">
                <span className="text-gray-400">
                  {isGreek ? "ΤΥΠΟΣ ΕΙΔΟΠΟΙΗΣΗΣ" : "NOTIFICATION TYPE"}
                </span>
                <span className="text-[#84cc16] font-black bg-lime-500/10 px-2 py-0.5 rounded-full border border-lime-500/20">
                  {unreadCount} {isGreek ? "ΕΝΕΡΓΕΣ" : "ACTIVE"}
                </span>
              </div>

              <div className="space-y-1">
                <div
                  onClick={() => setActiveFilter("ALL")}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                    activeFilter === "ALL" ? "bg-white/70 text-black font-black border border-white/80 shadow-xs" : "text-gray-600 hover:bg-white/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Bell size={16} className="text-gray-400" />
                    <span className="text-xs font-bold">
                      {isGreek ? "Όλες οι ειδοποιήσεις" : "All Notifications"}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-400">{counts.all}</span>
                </div>

                <div
                  onClick={() => setActiveFilter("APPOINTMENTS")}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                    activeFilter === "APPOINTMENTS" ? "bg-white/70 text-black font-black border border-white/80 shadow-xs" : "text-gray-600 hover:bg-white/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-emerald-500" />
                    <span className="text-xs font-bold">
                      {isGreek ? "Ραντεβού" : "Appointments"}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-400">{counts.appointments}</span>
                </div>

                <div
                  onClick={() => setActiveFilter("ACCOUNT")}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                    activeFilter === "ACCOUNT" ? "bg-white/70 text-black font-black border border-white/80 shadow-xs" : "text-gray-600 hover:bg-white/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-blue-500" />
                    <span className="text-xs font-bold">
                      {isGreek ? "Λογαριασμός" : "Account"}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-400">{counts.account}</span>
                </div>

                <div
                  onClick={() => setActiveFilter("PAYMENTS")}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                    activeFilter === "PAYMENTS" ? "bg-white/70 text-black font-black border border-white/80 shadow-xs" : "text-gray-600 hover:bg-white/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard size={16} className="text-purple-500" />
                    <span className="text-xs font-bold">
                      {isGreek ? "Πληρωμές" : "Payments"}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-400">{counts.payments}</span>
                </div>

                <div
                  onClick={() => setActiveFilter("REVIEWS")}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                    activeFilter === "REVIEWS" ? "bg-white/70 text-black font-black border border-white/80 shadow-xs" : "text-gray-600 hover:bg-white/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Star size={16} className="text-amber-500" />
                    <span className="text-xs font-bold">
                      {isGreek ? "Αξιολογήσεις" : "Reviews"}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-400">{counts.reviews}</span>
                </div>

                <div
                  onClick={() => setActiveFilter("SYSTEM")}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                    activeFilter === "SYSTEM" ? "bg-white/70 text-black font-black border border-white/80 shadow-xs" : "text-gray-600 hover:bg-white/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Settings size={16} className="text-gray-400" />
                    <span className="text-xs font-bold">
                      {isGreek ? "Σύστημα" : "System"}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-400">{counts.system}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Recent Notifications (8 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="lg:col-span-8 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-[32px] p-6 sm:p-8 border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.03)] transition-all duration-300"
          >
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200/40">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  {isGreek ? "Πρόσφατες Ειδοποιήσεις" : "Recent Notifications"}
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  {filteredNotifications.length}{" "}
                  {isGreek ? "συνολικές ειδοποιήσεις" : "total notifications"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => dispatch(markAllAsRead())}
                    className="text-[10px] font-black uppercase tracking-wider text-gray-700 hover:text-black flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/30 hover:bg-white/60 border border-white/50 transition-all cursor-pointer"
                  >
                    <CheckCheck size={14} className="text-[#84cc16]" />
                    <span>{isGreek ? "Ανάγνωση όλων" : "Mark all read"}</span>
                  </button>
                )}

                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="bg-white/35 border border-white/50 text-xs font-bold text-gray-800 rounded-xl px-3.5 py-2 focus:outline-none focus:border-[#CBFF38] shadow-xs backdrop-blur-sm cursor-pointer"
                >
                  <option value="newest">{isGreek ? "Νεότερες πρώτα" : "Newest first"}</option>
                  <option value="oldest">{isGreek ? "Παλαιότερες πρώτα" : "Oldest first"}</option>
                  <option value="unread">{isGreek ? "Μη αναγνωσμένες" : "Unread first"}</option>
                </select>
              </div>
            </div>

            {/* Notification Items List */}
            {filteredNotifications.length === 0 ? (
              <div className="py-16 text-center">
                <div className="size-14 rounded-2xl bg-white/35 border border-white/50 backdrop-blur-md flex items-center justify-center text-gray-400 mx-auto mb-3 shadow-xs">
                  <Bell size={28} className="text-[#84cc16]" />
                </div>
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                  {isGreek ? "Δεν βρέθηκαν ειδοποιήσεις" : "No Notifications Found"}
                </h4>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  {isGreek
                    ? "Δεν υπάρχουν ειδοποιήσεις που να ταιριάζουν με τα κριτήρια αναζήτησης."
                    : "There are no notifications matching your search or category filter."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedNotifications.map((notif) => (
                  <motion.div
                    key={notif.id}
                    layout
                    onClick={() => handleNotificationClick(notif)}
                    className="bg-white/25 hover:bg-white/55 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-white/45 hover:border-[#CBFF38] shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between gap-4 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                      {getNotificationIcon(notif.type)}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-sm text-gray-900 tracking-tight group-hover:text-black truncate">
                            {notif.title}
                          </h3>
                        </div>
                        <p className="text-xs text-gray-500 font-medium mt-0.5 leading-relaxed line-clamp-1">
                          {notif.message}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 text-right">
                      <span className="text-xs font-bold text-gray-400 whitespace-nowrap">
                        {notif.createdAt}
                      </span>
                      {!notif.isRead && (
                        <span className="size-2 rounded-full bg-[#84cc16] shadow-2xs shrink-0" />
                      )}
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-black group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {filteredNotifications.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-gray-100/90 text-xs text-gray-500 font-medium">
                {/* Showing X - Y of Z + Per Page Selector */}
                <div className="flex items-center gap-3">
                  <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    {isGreek
                      ? `Εμφάνιση ${Math.min((currentPage - 1) * itemsPerPage + 1, filteredNotifications.length)} - ${Math.min(currentPage * itemsPerPage, filteredNotifications.length)} από ${filteredNotifications.length}`
                      : `Showing ${Math.min((currentPage - 1) * itemsPerPage + 1, filteredNotifications.length)} - ${Math.min(currentPage * itemsPerPage, filteredNotifications.length)} of ${filteredNotifications.length}`}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                    <span>•</span>
                    <span className="uppercase tracking-wider">{isGreek ? "Ανά σελίδα:" : "Per page:"}</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-white border border-gray-200 text-gray-700 rounded-lg px-2 py-0.5 text-[11px] font-black focus:outline-none focus:border-[#CBFF38] shadow-2xs cursor-pointer"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>
                  </div>
                </div>

                {/* Page Numbers & Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="size-8 rounded-xl bg-white border border-gray-200/80 flex items-center justify-center text-gray-600 hover:bg-[#CBFF38] hover:text-black hover:border-[#CBFF38] disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs cursor-pointer"
                    title="Previous Page"
                  >
                    <ChevronLeft size={15} />
                  </button>

                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    const isActive = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`size-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                          isActive
                            ? "bg-[#CBFF38] text-black shadow-2xs border border-[#CBFF38]"
                            : "bg-white border border-gray-200/80 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="size-8 rounded-xl bg-white border border-gray-200/80 flex items-center justify-center text-gray-600 hover:bg-[#CBFF38] hover:text-black hover:border-[#CBFF38] disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs cursor-pointer"
                    title="Next Page"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ClientNotifications;

import { ReactNode, useEffect, useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { OverstockLogo } from "../common/OverstockLogo";
import {
  LayoutDashboard,
  Users,
  ArrowDownCircle,
  ArrowUpCircle,
  ShoppingBag,
  MessageSquare,
  Settings,
  Menu,
  X,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Moon,
  Sun,
  Package,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import api from "../../services/api";
import { getAdminSocket, initAdminSocket } from "./adminSocket";
import { toast } from "sonner";
import { AdminLanguageSwitcher } from "./AdminLanguageSwitcher";

// Order notification interface
interface OrderNotification {
  id: string;
  orderId: number;
  orderNumber: string;
  userName: string;
  productName: string;
  productPrice: number;
  createdAt: Date;
  isRead: boolean;
}

// Deposit notification interface
interface DepositNotification {
  id: string;
  requestId: number;
  userName: string;
  amount: number;
  createdAt: Date;
  isRead: boolean;
}

// Withdrawal notification interface
interface WithdrawalNotification {
  id: string;
  requestId: string;
  userName: string;
  amount: number;
  withdrawalType: string;
  createdAt: Date;
  isRead: boolean;
}

interface AdminLayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const baseMenuItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "users", icon: Users, label: "Users" },
  { id: "products", icon: Package, label: "Products" },
  { id: "deposits", icon: ArrowDownCircle, label: "Deposits" },
  { id: "withdrawals", icon: ArrowUpCircle, label: "Withdrawals" },
  { id: "orders", icon: ShoppingBag, label: "Orders" },
  { id: "chat", icon: MessageSquare, label: "Chat Support" },
  { id: "settings", icon: Settings, label: "Settings" },
] as const;

const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 'http://localhost:5000';

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(date).toLocaleDateString();
}

export function AdminLayout({ children, currentPage, onNavigate, onLogout }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState<number>(0);
  const [adminData, setAdminData] = useState<any>(null);
  const socketInitialized = useRef(false);
  const { t: tAccountMenu } = useTranslation('adminAccountMenu');
  const { t: tSidebar } = useTranslation('adminSidebar');

  // 🔔 Order notifications state
  const [orderNotifications, setOrderNotifications] = useState<OrderNotification[]>(() => {
    try {
      const saved = localStorage.getItem('admin:orderNotifications');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // 💰 Deposit notifications state
  const [depositNotifications, setDepositNotifications] = useState<DepositNotification[]>(() => {
    try {
      const saved = localStorage.getItem('admin:depositNotifications');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // 💸 Withdrawal notifications state
  const [withdrawalNotifications, setWithdrawalNotifications] = useState<WithdrawalNotification[]>(() => {
    try {
      const saved = localStorage.getItem('admin:withdrawalNotifications');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const orderAudioRef = useRef<HTMLAudioElement | null>(null);

  // 🔊 Global play sound function - attached to window so socket handler can call it
  useEffect(() => {
    (window as any).__playOrderSound = () => {
      console.log('[AdminLayout] 🔊 __playOrderSound called from window');
      const audioSrc = new URL('../../assets/sound/noti.mp3', import.meta.url).href;
      const audio = new Audio(audioSrc);
      audio.volume = 1;
      audio.play();
    };
    return () => {
      delete (window as any).__playOrderSound;
    };
  }, []);

  // 🔊 Simple function to play sound - called directly when needed
  const playOrderNotificationSound = () => {
    console.log('[AdminLayout] 🔊 playOrderNotificationSound called');
    try {
      // Use the audio ref directly - NO CONDITIONS, always try to play
      const audio = orderAudioRef.current;
      if (audio) {
        console.log('[AdminLayout] 🔊 Playing audio...');
        audio.currentTime = 0;
        audio.volume = 1;
        audio.play().then(() => {
          console.log('[AdminLayout] ✅ Audio played successfully!');
        }).catch(e => {
          console.log('[AdminLayout] ❌ Audio play failed:', e);
        });
      } else {
        console.log('[AdminLayout] ❌ No audio ref found');
      }
    } catch (e) {
      console.log('[AdminLayout] ❌ Sound error:', e);
    }
  };

  // Sound enabled state (requires user interaction first)
  const [orderSoundEnabled, setOrderSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem('admin:orderSoundEnabled') === '1';
    } catch { return false; }
  });
  // Use ref to avoid stale closure in socket handler
  const orderSoundEnabledRef = useRef(orderSoundEnabled);
  useEffect(() => { orderSoundEnabledRef.current = orderSoundEnabled; }, [orderSoundEnabled]);

  // Count unread order notifications
  const unreadOrderCount = orderNotifications.filter(n => !n.isRead).length;

  // Count unread deposit notifications
  const unreadDepositCount = depositNotifications.filter(n => !n.isRead).length;

  // Count unread withdrawal notifications
  const unreadWithdrawalCount = withdrawalNotifications.filter(n => !n.isRead).length;

  // Total unread notifications
  const totalUnreadCount = unreadOrderCount + unreadDepositCount + unreadWithdrawalCount;

  // Play notification sound with multiple fallback strategies
  const playOrderSound = useCallback(async () => {
    console.log('[AdminLayout] playOrderSound called, enabled:', orderSoundEnabledRef.current);

    try {
      // Check if sound is enabled (user has clicked to enable) - use REF to avoid stale closure
      if (!orderSoundEnabledRef.current) {
        console.log('[AdminLayout] Order sound not enabled yet - user needs to click Enable Sound');
        return;
      }

      const soundDisabled = localStorage.getItem('admin:soundEnabled') === '0';
      if (soundDisabled) {
        console.log('[AdminLayout] Sound disabled by preference');
        return;
      }

      console.log('[AdminLayout] Attempting to play sound...');

      const playStrategies = [
        // Strategy 1: Use existing audio element
        async () => {
          console.log('[AdminLayout] Trying strategy 1: existing audio element');
          const a = orderAudioRef.current;
          if (a) {
            a.currentTime = 0;
            a.volume = 1;
            await a.play();
            return true;
          }
          return false;
        },
        // Strategy 2: Create new audio element
        async () => {
          console.log('[AdminLayout] Trying strategy 2: new Audio()');
          const audio = new Audio(new URL('../../assets/sound/noti.mp3', import.meta.url).toString());
          audio.volume = 1;
          await audio.play();
          return true;
        },
        // Strategy 3: Use Web Audio API
        async () => {
          console.log('[AdminLayout] Trying strategy 3: Web Audio API');
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
          }
          const response = await fetch(new URL('../../assets/sound/noti.mp3', import.meta.url).toString());
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContext.destination);
          source.start(0);
          return true;
        }
      ];

      // Try each strategy until one succeeds
      for (const strategy of playStrategies) {
        try {
          const success = await strategy();
          if (success) {
            console.log('[AdminLayout] ✅ Order sound played successfully');
            return;
          }
        } catch (error) {
          console.warn('[AdminLayout] Sound strategy failed:', error);
        }
      }

      console.error('[AdminLayout] ❌ All sound strategies failed');
    } catch (err) {
      console.error('[AdminLayout] Sound error:', err);
    }
  }, []); // No dependencies - uses ref

  // Enable sound (requires user click)
  const enableOrderSound = useCallback(async () => {
    try {
      // Update both state and ref
      setOrderSoundEnabled(true);
      orderSoundEnabledRef.current = true;
      localStorage.setItem('admin:orderSoundEnabled', '1');

      console.log('[AdminLayout] Enabling order sound...');

      // Play a test sound to confirm it works
      const audio = new Audio(new URL('../../assets/sound/noti.mp3', import.meta.url).toString());
      audio.volume = 0.5;
      await audio.play();

      console.log('[AdminLayout] ✅ Order sound enabled and test played');
      toast.success('🔔 Order notifications enabled!', { duration: 2000 });
    } catch (err) {
      console.error('[AdminLayout] Enable sound failed:', err);
      toast.error('Failed to enable sound. Please try again.');
    }
  }, []);

  // Mark all order notifications as read
  const markAllOrdersRead = useCallback(() => {
    setOrderNotifications(prev => {
      const updated = prev.map(n => ({ ...n, isRead: true }));
      try { localStorage.setItem('admin:orderNotifications', JSON.stringify(updated)); } catch { }
      return updated;
    });
  }, []);

  // Clear all order notifications
  const clearOrderNotifications = useCallback(() => {
    setOrderNotifications([]);
    try { localStorage.removeItem('admin:orderNotifications'); } catch { }
  }, []);

  // Mark all notifications as read (both order and deposit)
  const markAllNotificationsRead = useCallback(() => {
    setOrderNotifications(prev => {
      const updated = prev.map(n => ({ ...n, isRead: true }));
      try { localStorage.setItem('admin:orderNotifications', JSON.stringify(updated)); } catch { }
      return updated;
    });
    setDepositNotifications(prev => {
      const updated = prev.map(n => ({ ...n, isRead: true }));
      try { localStorage.setItem('admin:depositNotifications', JSON.stringify(updated)); } catch { }
      return updated;
    });
    setWithdrawalNotifications(prev => {
      const updated = prev.map(n => ({ ...n, isRead: true }));
      try { localStorage.setItem('admin:withdrawalNotifications', JSON.stringify(updated)); } catch { }
      return updated;
    });
  }, []);

  // Clear all notifications (order, deposit, withdrawal)
  const clearAllNotifications = useCallback(() => {
    setOrderNotifications([]);
    setDepositNotifications([]);
    setWithdrawalNotifications([]);
    try {
      localStorage.removeItem('admin:orderNotifications');
      localStorage.removeItem('admin:depositNotifications');
      localStorage.removeItem('admin:withdrawalNotifications');
    } catch { }
  }, []);

  useEffect(() => {
    const data = localStorage.getItem('adminData');
    if (data) {
      setAdminData(JSON.parse(data));
    }

    // Initialize socket and fetch unread count
    if (!socketInitialized.current) {
      socketInitialized.current = true;

      const initData = async () => {
        try {
          // Fetch initial unread count
          const res = await api.adminChatListThreads({ page: 1, limit: 100 });
          const total = (res?.data?.threads || []).reduce((sum: number, t: any) => sum + (t.unreadForAdmin || 0), 0);
          setChatUnread(total);

          // 💰 Load pending deposit requests as notifications
          try {
            const depositRes = await api.adminListDepositRequests({ status: 'pending', page: 1, limit: 50 });
            const pendingDeposits = (depositRes?.data?.requests || []).map((req: any) => ({
              id: `deposit-${req.id}`,
              requestId: req.id,
              userName: req.user?.fullName || 'Unknown',
              amount: req.amount,
              createdAt: new Date(req.requestDate),
              isRead: false
            }));

            // Merge with existing localStorage notifications (avoid duplicates)
            setDepositNotifications(prev => {
              const existingIds = new Set(prev.map(n => n.requestId));
              const newNotifications = pendingDeposits.filter((n: any) => !existingIds.has(n.requestId));
              const merged = [...newNotifications, ...prev].slice(0, 50);
              try { localStorage.setItem('admin:depositNotifications', JSON.stringify(merged)); } catch { }
              return merged;
            });
          } catch (e) {
            console.error('[AdminLayout] Failed to load pending deposits:', e);
          }

          // 💸 Load pending withdrawal requests as notifications
          try {
            const withdrawalRes = await api.adminListWithdrawalRequests({ status: 'pending', page: 1, limit: 50 });
            const pendingWithdrawals = (withdrawalRes?.data?.requests || []).map((req: any) => ({
              id: `withdrawal-${req.id}`,
              requestId: req.id,
              userName: req.user?.fullName || 'Unknown',
              amount: req.amount,
              withdrawalType: req.withdrawalType || 'bank',
              createdAt: new Date(req.requestDate),
              isRead: false
            }));

            // Merge with existing localStorage notifications (avoid duplicates)
            setWithdrawalNotifications(prev => {
              const existingIds = new Set(prev.map(n => n.requestId));
              const newNotifications = pendingWithdrawals.filter((n: any) => !existingIds.has(n.requestId));
              const merged = [...newNotifications, ...prev].slice(0, 50);
              try { localStorage.setItem('admin:withdrawalNotifications', JSON.stringify(merged)); } catch { }
              return merged;
            });
          } catch (e) {
            console.error('[AdminLayout] Failed to load pending withdrawals:', e);
          }

          // Initialize socket
          const token = localStorage.getItem('adminToken');
          if (token) {
            let s = getAdminSocket();
            if (!s || !s.connected) {
              s = initAdminSocket(token);
              console.log('[AdminLayout] Initialized global admin socket');
            }

            console.log('[AdminLayout] 🔌 Socket connected:', s.connected, 'id:', s.id);

            // Chat thread updated handler - play sound if not on chat page
            const chatHandler = (data: any) => {
              console.log('[AdminLayout] 💬 Received chat:threadUpdated:', data);

              // Re-fetch count when message received
              api.adminChatListThreads({ page: 1, limit: 100 }).then(r => {
                const updatedTotal = (r?.data?.threads || []).reduce((sum: number, t: any) => sum + (t.unreadForAdmin || 0), 0);
                setChatUnread(updatedTotal);
              });

              // 🔊 Play sound if admin is NOT on chat page
              const currentPage = window.location.pathname;
              const isOnChatPage = currentPage.includes('/admin/chat');
              console.log('[AdminLayout] 💬 Current page:', currentPage, 'isOnChatPage:', isOnChatPage);

              if (!isOnChatPage) {
                try {
                  const audioSrc = new URL('../../assets/sound/noti.mp3', import.meta.url).href;
                  const audio = new Audio(audioSrc);
                  audio.volume = 1;
                  audio.play();
                  console.log('[AdminLayout] 🔊 Chat notification sound played!');
                } catch (e) {
                  console.error('[AdminLayout] ❌ Chat sound error:', e);
                }

                // Show toast notification
                toast.info('💬 New Message!', {
                  description: 'You have a new chat message',
                  duration: 3000,
                  action: {
                    label: 'View',
                    onClick: () => onNavigate('chat')
                  }
                });
              }
            };

            s.on('chat:threadUpdated', chatHandler);

            console.log('[AdminLayout] ✅ Registered listener for chat:threadUpdated');
            console.log('[AdminLayout] ℹ️ Order notifications are handled in separate useEffect');

            return () => {
              s.off('chat:threadUpdated', chatHandler);
            };
          }
        } catch (err) {
          console.error('[AdminLayout] Init error:', err);
        }
      };

      initData();
    }
  }, [onNavigate]); // Removed playOrderSound - it uses ref now

  // 🔔 Separate effect for order:new listener - ensures it's always registered
  useEffect(() => {
    const setupOrderListener = () => {
      const s = getAdminSocket();
      if (!s) {
        console.log('[AdminLayout] No socket available for order listener');
        return;
      }

      const orderHandler = async (data: any) => {
        console.log('[AdminLayout] 🛒 ORDER:NEW EVENT RECEIVED:', data);

        const newNotification: OrderNotification = {
          id: `order-${data.orderId}-${Date.now()}`,
          orderId: data.orderId,
          orderNumber: data.orderNumber,
          userName: data.userName || 'Unknown',
          productName: data.productName,
          productPrice: data.productPrice,
          createdAt: new Date(data.createdAt),
          isRead: false
        };

        setOrderNotifications(prev => {
          const updated = [newNotification, ...prev].slice(0, 50);
          try { localStorage.setItem('admin:orderNotifications', JSON.stringify(updated)); } catch { }
          return updated;
        });

        // 🔊 Play sound using global function
        if ((window as any).__playOrderSound) {
          (window as any).__playOrderSound();
        }

        // Show toast
        toast.success('🛒 New Order!', {
          description: `${data.userName} ordered ${data.productName} - $${data.productPrice}`,
          duration: 5000
        });
      };

      // Remove any existing listener first, then add new one
      s.off('order:new');
      s.on('order:new', orderHandler);
      console.log('[AdminLayout] 🔔 Order listener registered on socket');

      // 💰 Deposit handler
      const depositHandler = (data: any) => {
        console.log('[AdminLayout] 💰 Received deposit:new:', data);

        // Create notification
        const newNotification: DepositNotification = {
          id: `deposit-${data.requestId}-${Date.now()}`,
          requestId: data.requestId,
          userName: data.userName || 'Unknown',
          amount: data.amount,
          createdAt: new Date(data.createdAt || Date.now()),
          isRead: false
        };

        setDepositNotifications(prev => {
          const updated = [newNotification, ...prev].slice(0, 50); // Keep max 50
          try { localStorage.setItem('admin:depositNotifications', JSON.stringify(updated)); } catch { }
          return updated;
        });

        // Play sound directly
        try {
          const audioSrc = new URL('../../assets/sound/noti.mp3', import.meta.url).href;
          const audio = new Audio(audioSrc);
          audio.volume = 1;
          audio.play();
        } catch (e) { /* ignore */ }

        // Show toast
        toast.success('💰 New Deposit Request!', {
          description: `${data.userName} requested $${data.amount} deposit`,
          duration: 5000,
          action: {
            label: 'View',
            onClick: () => onNavigate('deposits')
          }
        });
      };

      s.off('deposit:new');
      s.on('deposit:new', depositHandler);
      console.log('[AdminLayout] 💰 Deposit listener registered on socket');

      // 💸 Withdrawal handler
      const withdrawalHandler = (data: any) => {
        console.log('[AdminLayout] 💸 Received withdrawal:new:', data);

        // Create notification
        const newNotification: WithdrawalNotification = {
          id: `withdrawal-${data.requestId}-${Date.now()}`,
          requestId: data.requestId,
          userName: data.userName || 'Unknown',
          amount: data.amount,
          withdrawalType: data.withdrawalType,
          createdAt: new Date(data.createdAt || Date.now()),
          isRead: false
        };

        setWithdrawalNotifications(prev => {
          const updated = [newNotification, ...prev].slice(0, 50);
          try { localStorage.setItem('admin:withdrawalNotifications', JSON.stringify(updated)); } catch { }
          return updated;
        });

        // 🔊 Play sound using global function
        if ((window as any).__playOrderSound) {
          (window as any).__playOrderSound();
        }

        // Show toast
        toast.success('💸 New Withdrawal Request!', {
          description: `${data.userName} requested $${data.amount} (${data.withdrawalType})`,
          duration: 5000,
          action: {
            label: 'View',
            onClick: () => onNavigate('withdrawals')
          }
        });
      };

      s.off('withdrawal:new');
      s.on('withdrawal:new', withdrawalHandler);
      console.log('[AdminLayout] 💸 Withdrawal listener registered on socket');

      return () => {
        s.off('order:new', orderHandler);
        s.off('deposit:new', depositHandler);
        s.off('withdrawal:new', withdrawalHandler);
      };
    };

    // Setup immediately and also after a delay (in case socket connects later)
    const cleanup1 = setupOrderListener();
    const timeoutId = setTimeout(() => {
      setupOrderListener();
    }, 2000);

    return () => {
      cleanup1?.();
      clearTimeout(timeoutId);
    };
  }, []);

  // Listen to broadcast from Chat page for recalculated totals
  useEffect(() => {
    const handler = (e: any) => {
      const n = Number(e?.detail || 0);
      if (!isNaN(n)) setChatUnread(n);
    };

    const profileHandler = (e: any) => {
      if (e.detail) setAdminData(e.detail);
    };

    // 🔊 Listen for order sound event
    const soundHandler = () => {
      console.log('[AdminLayout] 🔊 Received admin:playOrderSound event');
      playOrderNotificationSound();
    };

    window.addEventListener('chatUnreadUpdated', handler as any);
    window.addEventListener('adminDataUpdated', profileHandler as any);
    window.addEventListener('admin:playOrderSound', soundHandler);

    return () => {
      window.removeEventListener('chatUnreadUpdated', handler as any);
      window.removeEventListener('adminDataUpdated', profileHandler as any);
      window.removeEventListener('admin:playOrderSound', soundHandler);
    };
  }, []);

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* 🔔 Hidden audio for order notifications */}
      <audio
        ref={orderAudioRef}
        src={new URL('../../assets/sound/noti.mp3', import.meta.url).toString()}
        preload="auto"
      />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-[280px] bg-white border-r border-gray-200 z-50 transition-transform duration-300 lg:translate-x-0 lg:sticky lg:top-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-3">
              <OverstockLogo svgClassName="h-7 w-auto text-gray-900" />
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {baseMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              const labelKey = item.id === 'chat' ? 'chatSupport' : item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setSidebarOpen(false);
                    if (item.id === 'chat') setChatUnread(0);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1 text-left text-sm">{tSidebar(labelKey)}</span>
                  {item.id === 'chat' && chatUnread > 0 && (
                    <Badge variant="secondary" className="bg-red-500 text-white text-xs">
                      {chatUnread}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Admin Profile */}
          <div className="p-4 border-t border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <Avatar className="w-10 h-10 border">
                <AvatarImage src={adminData?.avatar ? `${API_BASE}${adminData.avatar}` : ""} />
                <AvatarFallback className="bg-blue-600 text-white">
                  {adminData?.fullName ? adminData.fullName.charAt(0).toUpperCase() : "AD"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate font-medium">
                  {adminData?.fullName || "Admin User"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {adminData?.email || "admin@example.com"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30 flex-shrink-0">
          <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
            {/* Left: Menu Button + Search */}
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-700 hover:text-gray-900"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Right: Language Switcher, Notifications, Profile */}
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Enable Sound Button - shows only if not enabled */}
              {!orderSoundEnabled && (
                <button
                  onClick={enableOrderSound}
                  className="flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg text-xs font-medium transition-colors"
                  title="Click to enable order notification sounds"
                >
                  <Bell className="w-4 h-4" />
                  <span className="hidden sm:inline">Enable Sound</span>
                </button>
              )}

              {/* Language Switcher */}
              <AdminLanguageSwitcher />

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                    <Bell className="w-5 h-5" />
                    {totalUnreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-medium px-1">
                        {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {totalUnreadCount > 0 && (
                      <Badge variant="secondary" className="bg-red-100 text-red-600 text-xs">
                        {totalUnreadCount} new
                      </Badge>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-[350px] overflow-y-auto">
                    {orderNotifications.length === 0 && depositNotifications.length === 0 && withdrawalNotifications.length === 0 ? (
                      <div className="py-8 text-center text-gray-500 text-sm">
                        No notifications yet
                      </div>
                    ) : (
                      <>
                        {/* All Notifications - Sorted by newest first */}
                        {(() => {
                          // Combine all notifications with type info
                          const allNotifications = [
                            ...depositNotifications.map(n => ({ ...n, type: 'deposit' as const })),
                            ...withdrawalNotifications.map(n => ({ ...n, type: 'withdrawal' as const })),
                            ...orderNotifications.map(n => ({ ...n, type: 'order' as const }))
                          ];

                          // Sort by createdAt (newest first)
                          allNotifications.sort((a, b) =>
                            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                          );

                          return allNotifications.slice(0, 15).map((notification) => {
                            if (notification.type === 'deposit') {
                              const n = notification as DepositNotification & { type: 'deposit' };
                              return (
                                <DropdownMenuItem
                                  key={n.id}
                                  className="flex flex-col items-start gap-1 py-3 cursor-pointer"
                                  onClick={() => onNavigate('deposits')}
                                >
                                  <div className="flex items-center gap-2 w-full">
                                    {!n.isRead && (
                                      <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                                    )}
                                    <ArrowDownCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                    <span className={`font-medium text-sm ${n.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                                      New Deposit Request
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 pl-6">
                                    {n.userName}
                                  </p>
                                  <div className="flex items-center justify-between w-full pl-6">
                                    <span className="text-xs text-green-600 font-medium">
                                      ${n.amount.toLocaleString()}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {formatTimeAgo(n.createdAt)}
                                    </span>
                                  </div>
                                </DropdownMenuItem>
                              );
                            } else if (notification.type === 'withdrawal') {
                              const n = notification as WithdrawalNotification & { type: 'withdrawal' };
                              return (
                                <DropdownMenuItem
                                  key={n.id}
                                  className="flex flex-col items-start gap-1 py-3 cursor-pointer"
                                  onClick={() => onNavigate('withdrawals')}
                                >
                                  <div className="flex items-center gap-2 w-full">
                                    {!n.isRead && (
                                      <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                                    )}
                                    <ArrowUpCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                    <span className={`font-medium text-sm ${n.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                                      New Withdrawal Request
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 pl-6">
                                    {n.userName}
                                  </p>
                                  <div className="flex items-center justify-between w-full pl-6">
                                    <span className="text-xs text-orange-600 font-medium lowercase">
                                      ${n.amount.toLocaleString()} ({n.withdrawalType})
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {formatTimeAgo(n.createdAt)}
                                    </span>
                                  </div>
                                </DropdownMenuItem>
                              );
                            } else {
                              const n = notification as OrderNotification & { type: 'order' };
                              return (
                                <DropdownMenuItem
                                  key={n.id}
                                  className="flex flex-col items-start gap-1 py-3 cursor-pointer"
                                  onClick={() => onNavigate('orders')}
                                >
                                  <div className="flex items-center gap-2 w-full">
                                    {!n.isRead && (
                                      <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                                    )}
                                    <ShoppingBag className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                    <span className={`font-medium text-sm ${n.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                                      New Order #{n.orderNumber}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 pl-6">
                                    {n.userName} - {n.productName}
                                  </p>
                                  <div className="flex items-center justify-between w-full pl-6">
                                    <span className="text-xs text-green-600 font-medium">
                                      ${n.productPrice.toLocaleString()}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      {formatTimeAgo(n.createdAt)}
                                    </span>
                                  </div>
                                </DropdownMenuItem>
                              );
                            }
                          });
                        })()}
                      </>
                    )}
                  </div>
                  {(orderNotifications.length > 0 || depositNotifications.length > 0 || withdrawalNotifications.length > 0) && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="flex gap-2 p-2">
                        <button
                          onClick={markAllNotificationsRead}
                          className="flex-1 text-xs text-blue-600 hover:text-blue-700 py-1"
                        >
                          Mark all read
                        </button>
                        <button
                          onClick={clearAllNotifications}
                          className="flex-1 text-xs text-gray-500 hover:text-gray-700 py-1"
                        >
                          Clear all
                        </button>
                      </div>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg">
                    <Avatar className="w-8 h-8 border">
                      <AvatarImage src={adminData?.avatar ? `${API_BASE}${adminData.avatar}` : ""} />
                      <AvatarFallback className="bg-blue-600 text-white text-xs">
                        {adminData?.fullName ? adminData.fullName.charAt(0).toUpperCase() : "AD"}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="w-4 h-4 text-gray-600 hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>{tAccountMenu('myAccount')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onNavigate('settings')}>
                    <User className="w-4 h-4 mr-2" />
                    {tAccountMenu('profile')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate('settings')}>
                    <Settings className="w-4 h-4 mr-2" />
                    {tAccountMenu('settings')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    {tAccountMenu('logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main
          className={`flex-1 p-4 lg:p-6 ${currentPage === 'chat'
            ? 'overflow-hidden flex flex-col min-h-0 h-full'
            : 'overflow-auto'}`}
        >
          <div
            className={`max-w-7xl mx-auto w-full ${currentPage === 'chat'
              ? 'flex-1 flex flex-col min-h-0 h-full'
              : ''}`}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

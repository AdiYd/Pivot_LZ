"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Package, 
  ShoppingCart, 
  MessageSquare,
  TrendingUp,
  Store,
} from "lucide-react";
import {
  PieChart as RePieChart, Pie, Cell, Sector,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  TooltipProps, LabelList
} from "recharts";

// Import the actual database
import exampleDatabase  from "@/schema/example";
import { getCategoryName } from "@/schema/messages";

function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend 
}: { 
  title: string; 
  value: number | string; 
  description: string; 
  icon: any; 
  trend?: { value: number; isPositive: boolean } 
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {typeof value === 'number' ? value.toLocaleString('he-IL') : value}
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          {trend && (
            <span className={`flex items-center gap-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className="h-3 w-3" />
              {trend.value}%
            </span>
          )}
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

// Custom active shape for pie charts for enhanced hover effect
const renderActiveShape = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const RADIAN = Math.PI / 180;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.9}
      />
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} fontSize={14} fontWeight="bold">
        {payload.name}
      </text>
      <text x={ex} y={ey} textAnchor={textAnchor} fill="#333" fontSize={12}>
        {`${payload.name}: ${value}`}
      </text>
      <text x={ex} y={ey} dy={18} textAnchor={textAnchor} fill="#999" fontSize={12}>
        {`(${(percent * 100).toFixed(0)}%)`}
      </text>
    </g>
  );
};

// Custom tooltip component with RTL support for Hebrew
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border rounded-md shadow-md text-right" dir="rtl">
        <p className="font-bold">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(exampleDatabase);
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);
  const [activeOrderPieIndex, setActiveOrderPieIndex] = useState<number | null>(null);
  const [activeConversationPieIndex, setActiveConversationPieIndex] = useState<number | null>(null);

  // Calculate statistics from real data
  const stats = useMemo(() => {
    try {
      const restaurants = Object.values(data.restaurants);
      const conversations = Object.values(data.conversations);

      // Restaurant stats
      const totalRestaurants = restaurants.length;
      const activeRestaurants = restaurants.filter(r => r.isActivated).length;
      const pendingPaymentRestaurants = restaurants.filter(r => r.payment.status === false).length;

      // Supplier and product stats
      let totalSuppliers = 0;
      let totalProducts = 0;
      restaurants.forEach(restaurant => {
        totalSuppliers += Object.keys(restaurant.suppliers).length;
        Object.values(restaurant.suppliers).forEach(supplier => {
          totalProducts += Object.keys(supplier.products).length;
        });
      });

      // Order stats
      let totalOrders = 0;
      let pendingOrders = 0;
      let sentOrders = 0;
      let deliveredOrders = 0;
      restaurants.forEach(restaurant => {
        const orders = Object.values(restaurant.orders);
        totalOrders += orders.length;
        pendingOrders += orders.filter(o => o.status === "pending").length;
        sentOrders += orders.filter(o => o.status === "sent").length;
        deliveredOrders += orders.filter(o => o.status === "delivered").length;
      });

      // Conversation stats
      const totalConversations = conversations.length;
      const activeConversations = conversations.filter(c => c.currentState !== "IDLE").length;
      const onboardingConversations = conversations.filter(c => 
        c.currentState.startsWith("ONBOARDING") || c.currentState === "WAITING_FOR_PAYMENT"
      ).length;

      return {
        totalRestaurants,
        activeRestaurants,
        pendingPaymentRestaurants,
        totalSuppliers,
        totalProducts,
        totalOrders,
        pendingOrders,
        sentOrders,
        deliveredOrders,
        totalConversations,
        activeConversations,
        onboardingConversations
      };
    } catch (error) {
      console.error("Error calculating stats:", error);
      return {
        totalRestaurants: 0,
        activeRestaurants: 0,
        pendingPaymentRestaurants: 0,
        totalSuppliers: 0,
        totalProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        sentOrders: 0,
        deliveredOrders: 0,
        totalConversations: 0,
        activeConversations: 0,
        onboardingConversations: 0
      };
    }
  }, [data]);

  // Generate recent activity from real data
  const recentActivity = useMemo(() => {
    try {
      const activities: Array<{
        id: string;
        type: string;
        restaurant: string;
        action: string;
        timestamp: string;
        status: string;
      }> = [];

      // Add order activities
      Object.values(data.restaurants).forEach(restaurant => {
        Object.values(restaurant.orders).forEach(order => {
          const supplier = restaurant.suppliers[order.supplierId];
          if (supplier) {
            activities.push({
              id: `order-${order.id}`,
              type: "order",
              restaurant: restaurant.name,
              action: `הזמינה מ${supplier.name}`,
              timestamp: getRelativeTime(order.createdAt.toDate()),
              status: order.status
            });
          }
        });
      });

      // Add conversation activities
      Object.entries(data.conversations).forEach(([phone, conversation]) => {
        const restaurant = Object.values(data.restaurants).find(r => r.legalId === conversation.restaurantId);
        if (restaurant && conversation.currentState !== "IDLE") {
          activities.push({
            id: `conv-${phone}`,
            type: "conversation",
            restaurant: restaurant.name,
            action: getConversationAction(conversation.currentState),
            timestamp: getRelativeTime(conversation.lastMessageTimestamp.toDate()),
            status: conversation.currentState
          });
        }
      });

      // Sort by timestamp and take latest 5
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);
    } catch (error) {
      console.error("Error generating activity:", error);
      return [];
    }
  }, [data]);

  // Generate alerts from real data
  const alerts = useMemo(() => {
    try {
      const alertsList: Array<{
        id: string;
        type: string;
        title: string;
        description: string;
        severity: "high" | "medium" | "low";
      }> = [];

      // Check for restaurants without payment
      if (stats.pendingPaymentRestaurants > 0) {
        alertsList.push({
          id: "payment-pending",
          type: "payment",
          title: `${stats.pendingPaymentRestaurants} מסעדות ממתינות לתשלום`,
          description: "מסעדות לא השלימו תהליך התשלום",
          severity: "high"
        });
      }

      // Check for active conversations needing attention
      if (stats.onboardingConversations > 0) {
        alertsList.push({
          id: "onboarding-pending",
          type: "conversation",
          title: `${stats.onboardingConversations} מסעדות בתהליך רישום`,
          description: "מסעדות ממתינות להשלמת תהליך הרישום",
          severity: "medium"
        });
      }

      // Check for pending orders
      if (stats.pendingOrders > 0) {
        alertsList.push({
          id: "orders-pending",
          type: "order",
          title: `${stats.pendingOrders} הזמנות ממתינות`,
          description: "הזמנות שלא נשלחו עדיין לספקים",
          severity: "medium"
        });
      }

      return alertsList;
    } catch (error) {
      console.error("Error generating alerts:", error);
      return [];
    }
  }, [stats]);

  // --- New: Aggregate data for charts ---
  // Pie: Restaurant status
  const restaurantPieData = [
    { name: "פעילות", value: stats.activeRestaurants },
    { name: "לא פעילות", value: stats.totalRestaurants - stats.activeRestaurants }
  ];
  // Pie: Order status
  const orderPieData = [
    { name: "ממתינות", value: stats.pendingOrders },
    { name: "נשלחו", value: stats.sentOrders },
    { name: "נמסרו", value: stats.deliveredOrders }
  ];
  // Bar: Suppliers per category
  const supplierCategoryCounts: Record<string, number> = {};
  Object.values(data.restaurants).forEach(r =>
    Object.values(r.suppliers).forEach(s =>
      s.category.forEach(cat => {
        supplierCategoryCounts[cat] = (supplierCategoryCounts[cat] || 0) + 1;
      })
    )
  );
  const supplierBarData = Object.entries(supplierCategoryCounts).map(([name, value]) => ({ name: getCategoryName(name), value }));

  // Line: Orders per day (last 7 days)
  const orderLineData: { date: string; value: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('he-IL', { month: 'short', day: 'numeric' });
    orderLineData.push({ date: label, value: 0 });
  }
  Object.values(data.restaurants).forEach(r =>
    Object.values(r.orders).forEach(o => {
      const d = o.createdAt.toDate();
      const label = d.toLocaleDateString('he-IL', { month: 'short', day: 'numeric' });
      const found = orderLineData.find(x => x.date === label);
      if (found) found.value += 1;
    })
  );

  // Pie: Conversation state
  const conversationStateCounts: Record<string, number> = {};
  Object.values(data.conversations).forEach(c => {
    const state = c.currentState.startsWith("ONBOARDING") ? "רישום"
      : c.currentState.startsWith("INVENTORY") ? "מלאי"
      : c.currentState.startsWith("ORDER") ? "הזמנה"
      : c.currentState === "IDLE" ? "רגיל"
      : "אחר";
    conversationStateCounts[state] = (conversationStateCounts[state] || 0) + 1;
  });
  const conversationPieData = Object.entries(conversationStateCounts).map(([name, value]) => ({ name, value }));

  // --- End chart data ---

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 pt-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-24 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">דף הבית</h1>
        <p className="text-muted-foreground">
          ברוך הבא למערכת ניהול המסעדות שלך. כאן תוכל לעקוב אחרי סטטיסטיקות, פעילות אחרונה, התראות וסטטוס המערכת.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 max-sm:gap-2 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="מסעדות רשומות"
          value={stats.totalRestaurants}
          description={`${stats.activeRestaurants} פעילות`}
          icon={Store}
          trend={{ value: Math.round((stats.activeRestaurants / stats.totalRestaurants) * 100), isPositive: true }}
        />
        <StatCard
          title="ספקים במערכת"
          value={stats.totalSuppliers}
          description={`${stats.totalProducts} מוצרים`}
          icon={Package}
          trend={{ value: Math.round((stats.totalProducts / stats.totalSuppliers) * 10), isPositive: true }}
        />
        <StatCard
          title="הזמנות סה״כ"
          value={stats.totalOrders}
          description={`${stats.pendingOrders} ממתינות`}
          icon={ShoppingCart}
          trend={{ value: stats.deliveredOrders > stats.pendingOrders ? 15 : -5, isPositive: stats.deliveredOrders > stats.pendingOrders }}
        />
        <StatCard
          title="שיחות פעילות"
          value={stats.activeConversations}
          description={`מתוך ${stats.totalConversations} שיחות`}
          icon={MessageSquare}
          trend={{ value: Math.round((stats.activeConversations / stats.totalConversations) * 100), isPositive: stats.activeConversations > 0 }}
        />
      </div>
      {/* --- Enhanced Visual Dashboard Section --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        {/* Pie: Restaurant status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">סטטוס מסעדות</CardTitle>
            <CardDescription>התפלגות מסעדות פעילות/לא פעילות</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <RePieChart margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                <defs>
                  <linearGradient id="pieColorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="pieColorInactive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" stopOpacity={1} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <Pie
                  data={restaurantPieData}
                  dataKey="value"
                  nameKey="name"
                  direction="rtl"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={4}
                  // activeIndex={activePieIndex}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) => setActivePieIndex(index)}
                  onMouseLeave={() => setActivePieIndex(null)}
                  isAnimationActive={true}
                  animationDuration={1200}
                  animationBegin={0}
                  animationEasing="ease-out"
                >
                  <Cell fill="url(#pieColorActive)" stroke="none" />
                  <Cell fill="url(#pieColorInactive)" stroke="none" />
                  <LabelList 
                    dataKey="name" 
                    position="outside" 
                    offset={15} 
                    style={{ fontSize: '11px', fontWeight: 'bold' }} 
                  />
                </Pie>
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle" 
                  wrapperStyle={{ paddingTop: '20px' }}
                />
                <RechartsTooltip content={<CustomTooltip />} />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Pie: Order status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">סטטוס הזמנות</CardTitle>
            <CardDescription>התפלגות סטטוס הזמנות</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <RePieChart margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                <defs>
                  <linearGradient id="orderPending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="orderSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={1} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="orderDelivered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <Pie
                  data={orderPieData}
                  dataKey="value"
                  nameKey="name"
                  direction="rtl"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={4}
                  // activeIndex={activeOrderPieIndex}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) => setActiveOrderPieIndex(index)}
                  onMouseLeave={() => setActiveOrderPieIndex(null)}
                  isAnimationActive={true}
                  animationDuration={1200}
                  animationBegin={0}
                  animationEasing="ease-out"
                >
                  <Cell fill="url(#orderPending)" stroke="none" />
                  <Cell fill="url(#orderSent)" stroke="none" />
                  <Cell fill="url(#orderDelivered)" stroke="none" />
                  <LabelList 
                    dataKey="name" 
                    position="outside" 
                    offset={15} 
                    style={{ fontSize: '11px', fontWeight: 'bold' }} 
                  />
                </Pie>
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle" 
                  wrapperStyle={{ paddingTop: '20px' }}
                />
                <RechartsTooltip content={<CustomTooltip />} />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Bar: Suppliers per category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">ספקים לפי קטגוריה</CardTitle>
            <CardDescription>מספר ספקים בכל קטגוריה</CardDescription>
          </CardHeader>
          <CardContent className="">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart 
            
                data={supplierBarData}
                barGap={8}
              >
                <defs>
                  {supplierBarData.map((_, index) => (
                    <linearGradient 
                      key={`gradient-${index}`} 
                      id={`barColor-${index}`} 
                      x1="0" y1="0" 
                      x2="0" y2="1"
                    >
                      <stop offset="0%" stopColor={`hsl(${index * 40 + 200}, 80%, 60%)`} stopOpacity={1} />
                      <stop offset="100%" stopColor={`hsl(${index * 40 + 200}, 70%, 40%)`} stopOpacity={0.8} />
                    </linearGradient>
                  ))}
                </defs>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  dy={10}
                  height={50}
                  interval={0}
                  angle={-25}
                  textAnchor="start"
                />
                <YAxis 
                  allowDecimals={false} 
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  dx={-10}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="value" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                  animationDuration={1500}
                  animationEasing="ease-out"
                >
                  {supplierBarData.map((_, i) => (
                    <Cell key={i} fill={`url(#barColor-${i})`} />
                  ))}
                  <LabelList 
                    dataKey="value" 
                    position="top" 
                    style={{ fontSize: '12px', fontWeight: 'bold', fill: '#64748b' }}
                    offset={5}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Pie: Conversation state */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">סטטוס שיחות</CardTitle>
            <CardDescription>התפלגות שיחות לפי מצב</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <RePieChart margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                <defs>
                  {conversationPieData.map((_, index) => (
                    <linearGradient 
                      key={`conv-gradient-${index}`} 
                      id={`convColor-${index}`} 
                      x1="0" y1="0" 
                      x2="0" y2="1"
                    >
                      <stop offset="0%" stopColor={`hsl(${index * 60 + 120}, 80%, 65%)`} stopOpacity={1} />
                      <stop offset="100%" stopColor={`hsl(${index * 60 + 120}, 70%, 55%)`} stopOpacity={0.8} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={conversationPieData}
                  dataKey="value"
                  nameKey="name"
                  direction="rtl"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={4}
                  // activeIndex={activeConversationPieIndex}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) => setActiveConversationPieIndex(index)}
                  onMouseLeave={() => setActiveConversationPieIndex(null)}
                  isAnimationActive={true}
                  animationDuration={1200}
                  animationBegin={0}
                  animationEasing="ease-out"
                >
                  {conversationPieData.map((_, index) => (
                    <Cell key={index} fill={`url(#convColor-${index})`} stroke="none" />
                  ))}
                  <LabelList 
                    dataKey="name" 
                    position="outside" 
                    offset={15} 
                    style={{ fontSize: '11px', fontWeight: 'bold' }} 
                  />
                </Pie>
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle" 
                  wrapperStyle={{ paddingTop: '20px' }}
                />
                <RechartsTooltip content={<CustomTooltip />} />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Line: Orders per day */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">מגמות הזמנות (7 ימים)</CardTitle>
            <CardDescription>מספר הזמנות בכל יום</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart 
                data={orderLineData}
                margin={{ top: 20, right: 30, left: 10, bottom: 30 }}
              >
                <defs>
                  <linearGradient id="lineColor" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  dy={10}
                />
                <YAxis 
                  allowDecimals={false} 
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  dx={-10}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="url(#lineColor)" 
                  strokeWidth={3}
                  dot={{ 
                    fill: 'white', 
                    stroke: '#3b82f6', 
                    strokeWidth: 2,
                    r: 4
                  }}
                  activeDot={{ 
                    fill: '#2563eb', 
                    stroke: 'white',
                    strokeWidth: 2,
                    r: 6,
                    
                    // boxShadow: '0 0 6px #2563eb'
                  }}
                  isAnimationActive={true}
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
                <Legend 
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '20px' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      {/* --- End Enhanced Visual Dashboard Section --- */}
    </div>
  );
}

// Helper functions
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) {
    return `לפני ${diffMinutes} דקות`;
  } else if (diffHours < 24) {
    return `לפני ${diffHours} שעות`;
  } else {
    return `לפני ${diffDays} ימים`;
  }
}

function getConversationAction(state: string): string {
  switch (state) {
    case "INVENTORY_SNAPSHOT_PRODUCT":
      return "בודק מלאי מוצרים";
    case "ONBOARDING_PAYMENT_METHOD":
      return "בתהליך רישום - תשלום";
    case "ORDER_CONFIRMATION":
      return "מאשר הזמנה";
    default:
      return "פעיל בשיחה";
  }
}

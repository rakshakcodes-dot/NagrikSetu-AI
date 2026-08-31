import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

interface ServerNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  complaintId?: string;
  isRead: boolean;
  priority: 'normal' | 'urgent' | 'warning';
  actionPage?: string;
  createdAt: string;
}

// In-memory backend notification store (synchronized with clients & DB)
const notificationsStore: ServerNotification[] = [
  {
    id: 'notif-srv-1',
    userId: 'all',
    title: '🌧️ IMD Monsoon Red Alert: Heavy Downpour Forecast',
    message:
      'IMD Panaji has issued heavy rainfall warnings for Tiswadi, Bardez, and Salcete coastal stretches. High vulnerability of flash waterlogging and asphalt erosion.',
    type: 'monsoon_advisory',
    priority: 'urgent',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    actionPage: 'complaint_map',
  },
  {
    id: 'notif-srv-2',
    userId: 'usr-cit-001',
    title: 'Work In Progress: Miramar Circle Crater (GRF-2026-1042)',
    message:
      'PWD Division III has dispatched Goa Rapid Repair Squad 2. Compactor roller and water evacuation deployed on site.',
    type: 'complaint_status',
    complaintId: 'GRF-2026-1042',
    priority: 'normal',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    actionPage: 'complaint_details',
  },
  {
    id: 'notif-srv-3',
    userId: 'usr-off-001',
    title: '⚠️ High-Priority Grievance Assigned: Mapusa Gandhi Chowk',
    message:
      'New critical pothole reported at Mapusa Gandhi Chowk (GRF-2026-1088). High public bus traffic corridor. SLA target: < 48 hours.',
    type: 'high_priority_alert',
    complaintId: 'GRF-2026-1088',
    priority: 'urgent',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    actionPage: 'complaint_details',
  },
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ---------------------------------------------------------
  // REST API ROUTES
  // ---------------------------------------------------------

  // 1. Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'NagrikSetu Civic Grievance Backend',
      time: new Date().toISOString(),
      notificationsCount: notificationsStore.length,
    });
  });

  // 2. GET all notifications or filtered by userId / role
  app.get('/api/notifications', (req: Request, res: Response) => {
    const { userId, role } = req.query;

    let filtered = [...notificationsStore];

    if (userId) {
      filtered = filtered.filter((n) => {
        if (n.userId === 'all') return true;
        if (n.userId === userId) return true;
        if (role === 'citizen' && (n.userId === 'citizens' || n.userId === 'citizen')) return true;
        if (role === 'officer' && (n.userId === 'officers' || n.userId === 'officer')) return true;
        return false;
      });
    }

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      success: true,
      count: filtered.length,
      notifications: filtered,
    });
  });

  // 3. POST create / broadcast a notification
  app.post('/api/notifications', (req: Request, res: Response) => {
    const body = req.body;
    if (!body.title || !body.message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    const newNotification: ServerNotification = {
      id: body.id || `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: body.userId || 'all',
      title: body.title,
      message: body.message,
      type: body.type || 'system',
      complaintId: body.complaintId || undefined,
      isRead: Boolean(body.isRead),
      priority: body.priority || 'normal',
      actionPage: body.actionPage || 'citizen_dashboard',
      createdAt: body.createdAt || new Date().toISOString(),
    };

    // Avoid duplicates
    const existingIndex = notificationsStore.findIndex((n) => n.id === newNotification.id);
    if (existingIndex >= 0) {
      notificationsStore[existingIndex] = newNotification;
    } else {
      notificationsStore.unshift(newNotification);
    }

    res.status(201).json({
      success: true,
      notification: newNotification,
    });
  });

  // 4. PATCH mark single notification as read
  app.patch('/api/notifications/:id/read', (req: Request, res: Response) => {
    const { id } = req.params;
    const notif = notificationsStore.find((n) => n.id === id);
    if (notif) {
      notif.isRead = true;
      return res.json({ success: true, notification: notif });
    }
    res.status(404).json({ error: 'Notification not found' });
  });

  // 5. POST mark all notifications as read for a user
  app.post('/api/notifications/read-all', (req: Request, res: Response) => {
    const { userId } = req.body;
    notificationsStore.forEach((n) => {
      if (!userId || n.userId === userId || n.userId === 'all' || n.userId === 'citizens' || n.userId === 'officers') {
        n.isRead = true;
      }
    });
    res.json({ success: true, message: 'All notifications marked as read' });
  });

  // 6. POST trigger Monsoon Advisory broadcast
  app.post('/api/notifications/trigger-monsoon-alert', (req: Request, res: Response) => {
    const { taluka = 'Panaji, Mapusa, & Margao', alertLevel = 'Red Alert' } = req.body;

    const monsoonNotification: ServerNotification = {
      id: `monsoon-${Date.now()}`,
      userId: 'all',
      title: `⛈️ ${alertLevel}: IMD Flash Flooding & Road Telemetry Advisory`,
      message: `Intense squall line over ${taluka}. PWD emergency desilting and road rapid patch squads activated. Emergency hotline 1077 active.`,
      type: 'monsoon_advisory',
      priority: 'urgent',
      isRead: false,
      actionPage: 'complaint_map',
      createdAt: new Date().toISOString(),
    };

    notificationsStore.unshift(monsoonNotification);

    res.status(201).json({
      success: true,
      message: 'Monsoon telemetry advisory broadcasted across all portals',
      notification: monsoonNotification,
    });
  });

  // 7. POST test notification dispatch
  app.post('/api/notifications/test', (req: Request, res: Response) => {
    const testNotif: ServerNotification = {
      id: `test-${Date.now()}`,
      userId: req.body.userId || 'all',
      title: '🔔 Backend Notification System Active',
      message: `Test notification generated at ${new Date().toLocaleTimeString()} by backend service. Express REST API & Supabase database in sync.`,
      type: 'system',
      priority: 'normal',
      isRead: false,
      actionPage: 'citizen_dashboard',
      createdAt: new Date().toISOString(),
    };

    notificationsStore.unshift(testNotif);
    res.status(201).json({ success: true, notification: testNotif });
  });

  // ---------------------------------------------------------
  // VITE MIDDLEWARE / STATIC ASSETS
  // ---------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NagrikSetu Backend Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

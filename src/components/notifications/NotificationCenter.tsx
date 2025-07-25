import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, X, Users, Award, Sparkles, Calendar } from 'lucide-react';
import { blink } from '@/blink/client';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: string;
  read_status: boolean;
  created_at: string;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    try {
      const user = await blink.auth.me();
      
      const notificationData = await blink.db.notifications.list({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' },
        limit: 20
      });

      setNotifications(notificationData);
      setUnreadCount(notificationData.filter(n => !Number(n.read_status)).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      await blink.db.notifications.update(notificationId, {
        read_status: true
      });
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read_status: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const user = await blink.auth.me();
      const unreadNotifications = notifications.filter(n => !Number(n.read_status));
      
      await Promise.all(
        unreadNotifications.map(n => 
          blink.db.notifications.update(n.id, { read_status: true })
        )
      );
      
      setNotifications(prev => prev.map(n => ({ ...n, read_status: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await blink.db.notifications.delete(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !Number(notification.read_status)) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'connection_request':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'badge_earned':
        return <Award className="h-4 w-4 text-amber-600" />;
      case 'match_found':
        return <Sparkles className="h-4 w-4 text-indigo-600" />;
      case 'group_assigned':
        return <Calendar className="h-4 w-4 text-green-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'connection_request':
        return 'border-l-blue-500';
      case 'badge_earned':
        return 'border-l-amber-500';
      case 'match_found':
        return 'border-l-indigo-500';
      case 'group_assigned':
        return 'border-l-green-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading notifications...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} size="sm" variant="outline">
              <Check className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No notifications yet</p>
            <p className="text-sm text-gray-400 mt-1">
              You'll see updates about connections, badges, and matches here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`border-l-4 ${getNotificationColor(notification.type)} bg-white p-4 rounded-r-lg shadow-sm ${
                  !Number(notification.read_status) ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        {!Number(notification.read_status) && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                      
                      <p className="text-xs text-gray-400">
                        {formatTimeAgo(notification.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-1 ml-4">
                    {!Number(notification.read_status) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAsRead(notification.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteNotification(notification.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft } from 'lucide-react';

interface CreatorChannel {
  id: string;
  channel_name: string;
  slug: string;
  description: string | null;
  sport_focus: string | null;
  avatar_url: string | null;
}

const ChannelsList = () => {
  const [channels, setChannels] = useState<CreatorChannel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('creator_channels')
        .select('*')
        .eq('status', 'approved')
        .order('channel_name', { ascending: true });

      if (error) throw error;
      setChannels(data || []);
    } catch (error) {
      console.error('Error fetching channels:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />

      <main className="md:ml-64 pt-16 md:pt-0 pb-20 md:pb-8">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Back button */}
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/hub">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Video Hub
            </Link>
          </Button>

          <h1 className="text-2xl font-bold mb-6">All Channels</h1>

          {channels.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No channels available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {channels.map((channel) => (
                <Link key={channel.id} to={`/channel/${channel.slug}`}>
                  <Card className="hover:border-primary/50 transition-colors h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={channel.avatar_url || ''} alt={channel.channel_name} />
                          <AvatarFallback className="bg-primary/20 text-primary text-lg">
                            {channel.channel_name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">{channel.channel_name}</h3>
                          {channel.sport_focus && (
                            <Badge variant="secondary" className="mt-1">
                              {channel.sport_focus}
                            </Badge>
                          )}
                          {channel.description && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {channel.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ChannelsList;

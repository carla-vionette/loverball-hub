import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import DesktopNav from '@/components/DesktopNav';
import MobileHeader from '@/components/MobileHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, RefreshCw, Check, X, Eye, Video, Users, Clock, 
  ExternalLink, ArrowLeft, Play, EyeOff
} from 'lucide-react';
import { format } from 'date-fns';

interface CreatorApplication {
  id: string;
  applicant_user_id: string;
  desired_channel_name: string;
  content_focus: string;
  example_content_links: string | null;
  social_handles: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  applicant_profile?: {
    name: string;
    profile_photo_url: string | null;
  } | null;
}

interface CreatorChannel {
  id: string;
  owner_user_id: string;
  channel_name: string;
  slug: string;
  description: string | null;
  sport_focus: string | null;
  status: string;
  avatar_url: string | null;
  created_at: string;
  video_count?: number;
  owner_profile?: {
    name: string;
  } | null;
}

interface VideoItem {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  is_published: boolean;
  created_at: string;
  channel: {
    channel_name: string;
    slug: string;
  };
}

const AdminCreators = () => {
  const [applications, setApplications] = useState<CreatorApplication[]>([]);
  const [channels, setChannels] = useState<CreatorChannel[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<CreatorApplication | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [channelSlug, setChannelSlug] = useState('');
  const [processing, setProcessing] = useState(false);

  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchData();
  }, [isAdmin, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [applicationsRes, channelsRes, videosRes] = await Promise.all([
        supabase
          .from('creator_applications')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('creator_channels')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('videos')
          .select(`
            id, title, video_url, thumbnail_url, is_published, created_at,
            channel:creator_channels!inner(channel_name, slug)
          `)
          .order('created_at', { ascending: false })
          .limit(50)
      ]);

      if (applicationsRes.error) throw applicationsRes.error;
      if (channelsRes.error) throw channelsRes.error;
      if (videosRes.error) throw videosRes.error;

      // Get profiles for applications
      const applicationsWithProfiles = await Promise.all(
        (applicationsRes.data || []).map(async (app) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, profile_photo_url')
            .eq('id', app.applicant_user_id)
            .single();
          return { ...app, applicant_profile: profile };
        })
      );

      // Get video counts for channels
      const channelsWithCounts = await Promise.all(
        (channelsRes.data || []).map(async (channel) => {
          const [videoCountRes, profileRes] = await Promise.all([
            supabase
              .from('videos')
              .select('id', { count: 'exact', head: true })
              .eq('channel_id', channel.id),
            supabase
              .from('profiles')
              .select('name')
              .eq('id', channel.owner_user_id)
              .single()
          ]);
          return {
            ...channel,
            video_count: videoCountRes.count || 0,
            owner_profile: profileRes.data
          };
        })
      );

      setApplications(applicationsWithProfiles);
      setChannels(channelsWithCounts);
      setVideos(videosRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Error loading data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleApproveApplication = async () => {
    if (!selectedApplication) return;
    
    const slug = channelSlug.trim() || generateSlug(selectedApplication.desired_channel_name);
    
    setProcessing(true);
    try {
      // Create the channel
      const { error: channelError } = await supabase
        .from('creator_channels')
        .insert({
          owner_user_id: selectedApplication.applicant_user_id,
          channel_name: selectedApplication.desired_channel_name,
          slug,
          description: selectedApplication.content_focus,
          status: 'approved'
        });

      if (channelError) {
        if (channelError.message.includes('duplicate')) {
          toast({ title: 'Slug already exists', description: 'Please choose a different channel slug', variant: 'destructive' });
          setProcessing(false);
          return;
        }
        throw channelError;
      }

      // Update the application
      const { error: appError } = await supabase
        .from('creator_applications')
        .update({
          status: 'approved',
          admin_notes: adminNotes || null,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedApplication.id);

      if (appError) throw appError;

      toast({ title: 'Application approved!', description: 'Channel has been created for the creator.' });
      setSelectedApplication(null);
      setAdminNotes('');
      setChannelSlug('');
      fetchData();
    } catch (error: any) {
      console.error('Error approving application:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeclineApplication = async () => {
    if (!selectedApplication) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('creator_applications')
        .update({
          status: 'declined',
          admin_notes: adminNotes || null,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedApplication.id);

      if (error) throw error;

      toast({ title: 'Application declined' });
      setSelectedApplication(null);
      setAdminNotes('');
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleChannelStatusChange = async (channelId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('creator_channels')
        .update({ status: newStatus })
        .eq('id', channelId);

      if (error) throw error;

      toast({ title: `Channel ${newStatus}` });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleVideoPublished = async (videoId: string, isPublished: boolean) => {
    try {
      const { error } = await supabase
        .from('videos')
        .update({ is_published: !isPublished })
        .eq('id', videoId);

      if (error) throw error;

      toast({ title: isPublished ? 'Video hidden' : 'Video published' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      submitted: 'secondary',
      under_review: 'outline',
      approved: 'default',
      declined: 'destructive',
      pending_review: 'secondary',
      rejected: 'destructive'
    };
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const pendingApplications = applications.filter(a => a.status === 'submitted' || a.status === 'under_review');

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
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Admin
                </Link>
              </Button>
              <h1 className="text-2xl font-bold">Creator Management</h1>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Clock className="w-8 h-8 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold">{pendingApplications.length}</p>
                    <p className="text-muted-foreground text-sm">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Users className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{channels.filter(c => c.status === 'approved').length}</p>
                    <p className="text-muted-foreground text-sm">Active Channels</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Video className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{videos.length}</p>
                    <p className="text-muted-foreground text-sm">Total Videos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Video className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{videos.filter(v => v.is_published).length}</p>
                    <p className="text-muted-foreground text-sm">Published</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="applications" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="applications">
                Applications
                {pendingApplications.length > 0 && (
                  <Badge className="ml-2" variant="destructive">{pendingApplications.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="channels">Channels</TabsTrigger>
              <TabsTrigger value="videos">Videos</TabsTrigger>
            </TabsList>

            {/* Applications Tab */}
            <TabsContent value="applications">
              <Card>
                <CardHeader>
                  <CardTitle>Creator Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  {applications.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No applications yet</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Applicant</TableHead>
                          <TableHead>Channel Name</TableHead>
                          <TableHead>Content Focus</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {applications.map((app) => (
                          <TableRow key={app.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={app.applicant_profile?.profile_photo_url || ''} />
                                  <AvatarFallback>
                                    {app.applicant_profile?.name?.substring(0, 2).toUpperCase() || '??'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{app.applicant_profile?.name || 'Unknown'}</span>
                              </div>
                            </TableCell>
                            <TableCell>{app.desired_channel_name}</TableCell>
                            <TableCell className="max-w-xs truncate">{app.content_focus}</TableCell>
                            <TableCell>{getStatusBadge(app.status)}</TableCell>
                            <TableCell>{format(new Date(app.created_at), 'MMM d, yyyy')}</TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedApplication(app);
                                  setChannelSlug(generateSlug(app.desired_channel_name));
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Review
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Channels Tab */}
            <TabsContent value="channels">
              <Card>
                <CardHeader>
                  <CardTitle>Creator Channels</CardTitle>
                </CardHeader>
                <CardContent>
                  {channels.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No channels yet</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Channel</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead>Sport Focus</TableHead>
                          <TableHead>Videos</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {channels.map((channel) => (
                          <TableRow key={channel.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={channel.avatar_url || ''} />
                                  <AvatarFallback>
                                    {channel.channel_name.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <span className="font-medium">{channel.channel_name}</span>
                                  <p className="text-xs text-muted-foreground">/{channel.slug}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{channel.owner_profile?.name || 'Unknown'}</TableCell>
                            <TableCell>{channel.sport_focus || '-'}</TableCell>
                            <TableCell>{channel.video_count}</TableCell>
                            <TableCell>{getStatusBadge(channel.status)}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                >
                                  <Link to={`/channel/${channel.slug}`} target="_blank">
                                    <ExternalLink className="w-4 h-4" />
                                  </Link>
                                </Button>
                                {channel.status === 'approved' && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleChannelStatusChange(channel.id, 'rejected')}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                )}
                                {channel.status === 'rejected' && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleChannelStatusChange(channel.id, 'approved')}
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                )}
                                {channel.status === 'pending_review' && (
                                  <>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => handleChannelStatusChange(channel.id, 'approved')}
                                    >
                                      <Check className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleChannelStatusChange(channel.id, 'rejected')}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Videos Tab */}
            <TabsContent value="videos">
              <Card>
                <CardHeader>
                  <CardTitle>All Videos</CardTitle>
                </CardHeader>
                <CardContent>
                  {videos.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No videos yet</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Thumbnail</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Channel</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {videos.map((video) => (
                          <TableRow key={video.id}>
                            <TableCell>
                              <div className="w-16 h-10 bg-muted rounded overflow-hidden">
                                {video.thumbnail_url ? (
                                  <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Play className="w-4 h-4 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium max-w-xs truncate">{video.title}</TableCell>
                            <TableCell>
                              <Link 
                                to={`/channel/${video.channel.slug}`} 
                                className="text-primary hover:underline"
                              >
                                {video.channel.channel_name}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Badge variant={video.is_published ? 'default' : 'secondary'}>
                                {video.is_published ? 'Published' : 'Hidden'}
                              </Badge>
                            </TableCell>
                            <TableCell>{format(new Date(video.created_at), 'MMM d, yyyy')}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                >
                                  <a href={video.video_url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </Button>
                                <Button
                                  variant={video.is_published ? 'destructive' : 'default'}
                                  size="sm"
                                  onClick={() => handleToggleVideoPublished(video.id, video.is_published)}
                                >
                                  {video.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Application Review Dialog */}
      <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Application</DialogTitle>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={selectedApplication.applicant_profile?.profile_photo_url || ''} />
                  <AvatarFallback>
                    {selectedApplication.applicant_profile?.name?.substring(0, 2).toUpperCase() || '??'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedApplication.applicant_profile?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Applied {format(new Date(selectedApplication.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                {getStatusBadge(selectedApplication.status)}
              </div>

              <div>
                <Label className="text-muted-foreground">Desired Channel Name</Label>
                <p className="font-medium">{selectedApplication.desired_channel_name}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">Content Focus</Label>
                <p>{selectedApplication.content_focus}</p>
              </div>

              {selectedApplication.example_content_links && (
                <div>
                  <Label className="text-muted-foreground">Example Content Links</Label>
                  <p className="whitespace-pre-wrap text-sm">{selectedApplication.example_content_links}</p>
                </div>
              )}

              {selectedApplication.social_handles && (
                <div>
                  <Label className="text-muted-foreground">Social Handles</Label>
                  <p>{selectedApplication.social_handles}</p>
                </div>
              )}

              {(selectedApplication.status === 'submitted' || selectedApplication.status === 'under_review') && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="channelSlug">Channel Slug (URL)</Label>
                    <Input
                      id="channelSlug"
                      value={channelSlug}
                      onChange={(e) => setChannelSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="channel-slug"
                    />
                    <p className="text-xs text-muted-foreground">
                      Will be accessible at /channel/{channelSlug || 'slug'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminNotes">Admin Notes (optional)</Label>
                    <Textarea
                      id="adminNotes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Internal notes about this application"
                      rows={3}
                    />
                  </div>
                </>
              )}

              {selectedApplication.admin_notes && selectedApplication.status !== 'submitted' && (
                <div>
                  <Label className="text-muted-foreground">Admin Notes</Label>
                  <p>{selectedApplication.admin_notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedApplication && (selectedApplication.status === 'submitted' || selectedApplication.status === 'under_review') && (
              <>
                <Button variant="outline" onClick={() => setSelectedApplication(null)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeclineApplication}
                  disabled={processing}
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 mr-1" />}
                  Decline
                </Button>
                <Button 
                  onClick={handleApproveApplication}
                  disabled={processing}
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                  Approve & Create Channel
                </Button>
              </>
            )}
            {selectedApplication && selectedApplication.status !== 'submitted' && selectedApplication.status !== 'under_review' && (
              <Button onClick={() => setSelectedApplication(null)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCreators;

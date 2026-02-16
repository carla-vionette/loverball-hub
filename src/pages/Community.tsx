import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import DesktopNav from "@/components/DesktopNav";
import BottomNav from "@/components/BottomNav";
import MobileHeader from "@/components/MobileHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, Users, Plus, Hash, Shield, Search, MessageSquare } from "lucide-react";

interface CommunityGroup {
  id: string;
  name: string;
  description: string | null;
  group_type: string;
  team_key: string | null;
  icon_emoji: string | null;
  is_official: boolean;
  rules: string | null;
  member_count: number;
  created_at: string;
}

const Community = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [myGroupIds, setMyGroupIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupEmoji, setNewGroupEmoji] = useState("💬");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, [user]);

  const fetchGroups = async () => {
    try {
      const { data: groupsData, error } = await supabase
        .from('community_groups')
        .select('*')
        .order('is_official', { ascending: false })
        .order('member_count', { ascending: false });

      if (error) throw error;
      setGroups(groupsData || []);

      if (user) {
        const { data: memberships } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id);
        
        setMyGroupIds(new Set(memberships?.map(m => m.group_id) || []));
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!user) {
      toast.error("Please sign in to join groups");
      return;
    }

    try {
      const { error } = await supabase
        .from('group_members')
        .insert({ group_id: groupId, user_id: user.id });

      if (error) throw error;

      setMyGroupIds(prev => new Set([...prev, groupId]));
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, member_count: g.member_count + 1 } : g));
      toast.success("Joined group!");
    } catch (err: any) {
      if (err.code === '23505') {
        toast("You're already in this group");
      } else {
        toast.error("Failed to join group");
      }
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      setMyGroupIds(prev => {
        const next = new Set(prev);
        next.delete(groupId);
        return next;
      });
      setGroups(prev => prev.map(g => g.id === groupId ? { ...g, member_count: Math.max(0, g.member_count - 1) } : g));
      toast("Left group");
    } catch {
      toast.error("Failed to leave group");
    }
  };

  const handleCreateGroup = async () => {
    if (!user || !newGroupName.trim()) return;

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('community_groups')
        .insert({
          name: newGroupName.trim(),
          description: newGroupDesc.trim() || null,
          icon_emoji: newGroupEmoji,
          group_type: 'custom',
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-join creator
      await supabase
        .from('group_members')
        .insert({ group_id: data.id, user_id: user.id, role: 'admin' });

      setGroups(prev => [{ ...data, member_count: 1 }, ...prev]);
      setMyGroupIds(prev => new Set([...prev, data.id]));
      setCreateOpen(false);
      setNewGroupName("");
      setNewGroupDesc("");
      toast.success("Group created!");
    } catch {
      toast.error("Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  const filteredGroups = groups.filter(g => {
    const matchesSearch = !searchQuery || g.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === "my") return matchesSearch && myGroupIds.has(g.id);
    if (activeTab === "teams") return matchesSearch && g.group_type === "team";
    if (activeTab === "interest") return matchesSearch && g.group_type !== "team";
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pl-64">
      <MobileHeader />
      <DesktopNav />
      
      <main className="container mx-auto px-4 pt-20 md:pt-8 py-8 pb-20 md:pb-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-1">Community</h1>
            <p className="text-muted-foreground">Join group chats and connect with fellow fans</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden md:inline">Create Group</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a Group</DialogTitle>
                <DialogDescription>Start a new interest-based group for the community</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="flex gap-3">
                  <Input
                    value={newGroupEmoji}
                    onChange={(e) => setNewGroupEmoji(e.target.value)}
                    className="w-16 text-center text-2xl"
                    maxLength={2}
                  />
                  <Input
                    placeholder="Group name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    maxLength={50}
                  />
                </div>
                <Textarea
                  placeholder="What's this group about? (optional)"
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  maxLength={200}
                  rows={3}
                />
                <Button onClick={handleCreateGroup} disabled={!newGroupName.trim() || creating} className="w-full rounded-full">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Group
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-full"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-transparent gap-2 h-auto p-0 w-full justify-start overflow-x-auto">
            <TabsTrigger value="all" className="rounded-full px-5 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              All Groups
            </TabsTrigger>
            <TabsTrigger value="my" className="rounded-full px-5 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              My Groups
            </TabsTrigger>
            <TabsTrigger value="teams" className="rounded-full px-5 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Team Chats
            </TabsTrigger>
            <TabsTrigger value="interest" className="rounded-full px-5 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Interest Groups
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Group Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              {activeTab === "my" ? "You haven't joined any groups yet" : "No groups found"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.map((group) => {
              const isMember = myGroupIds.has(group.id);
              return (
                <Card
                  key={group.id}
                  className="hover:shadow-lg transition-all duration-300 rounded-2xl border-border/50 overflow-hidden"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl flex-shrink-0">
                        {group.icon_emoji || '💬'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-base truncate">{group.name}</h3>
                          {group.is_official && (
                            <Shield className="h-3.5 w-3.5 text-medium-blue flex-shrink-0" />
                          )}
                        </div>
                        {group.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{group.description}</p>
                        )}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>{group.member_count} {group.member_count === 1 ? 'member' : 'members'}</span>
                          </div>
                          <Badge variant="secondary" className="text-[10px] px-2 py-0">
                            {group.group_type === 'team' ? '🏟️ Team' : group.group_type === 'interest' ? '✨ Interest' : '👥 Custom'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      {isMember ? (
                        <>
                          <Button
                            className="flex-1 rounded-full"
                            onClick={() => navigate(`/community/${group.id}`)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Open Chat
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full text-xs"
                            onClick={() => handleLeaveGroup(group.id)}
                          >
                            Leave
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          className="flex-1 rounded-full"
                          onClick={() => handleJoinGroup(group.id)}
                        >
                          Join Group
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      
      <BottomNav />
    </div>
  );
};

export default Community;
import TeamFollowSection from "@/components/TeamFollowSection";
import { EmptyState } from "@/components/ui/empty-state";
import { Trophy } from "lucide-react";
import { motion } from "framer-motion";

const ProfileTeamsTab = () => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
    <TeamFollowSection />
  </motion.div>
);

export default ProfileTeamsTab;

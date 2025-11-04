import Navigation from "@/components/Navigation";
import ContentCarousel from "@/components/ContentCarousel";
import heroBanner from "@/assets/hero-banner.jpg";
import heroVideo from "@/assets/hero-video.mov";
import colorCoverageVideo from "@/assets/color-coverage-video.mp4";
import beyondCourt from "@/assets/beyond-court.jpg";
import gameChangers from "@/assets/game-changers.jpg";
import trainingDay from "@/assets/training-day.jpg";
import risingStars from "@/assets/rising-stars.jpg";
import coachCorner from "@/assets/coach-corner.jpg";
import finalSeason from "@/assets/final-season.jpg";
import powerplay from "@/assets/powerplay.jpg";
import overtime from "@/assets/overtime.jpg";
import fullCourtPress from "@/assets/full-court-press.jpg";
import teamSpirit from "@/assets/team-spirit.jpg";
import marathon from "@/assets/marathon.jpg";
import pickupGame from "@/assets/pickup-game.jpg";
import soccerMom from "@/assets/soccer-mom.jpg";
import weekendWarriors from "@/assets/weekend-warriors.jpg";
import gymTalk from "@/assets/gym-talk.jpg";

const Home = () => {
  const unscriptedContent = [
    {
      id: 1,
      title: "Color & Coverage",
      image: colorCoverageVideo,
      description: "Featured video content showcasing women in sports",
    },
    {
      id: 2,
      title: "Beyond the Court",
      image: beyondCourt,
      description: "Follow three WNBA players as they navigate life on and off the court",
    },
    {
      id: 3,
      title: "Game Changers",
      image: gameChangers,
      description: "Documentary series celebrating women breaking barriers in sports",
    },
    {
      id: 4,
      title: "Training Day",
      image: trainingDay,
      description: "Behind-the-scenes look at elite female athletes' training routines",
    },
    {
      id: 5,
      title: "Rising Stars",
      image: risingStars,
      description: "Young female athletes pursuing their dreams in competitive sports",
    },
    {
      id: 6,
      title: "Coach's Corner",
      image: coachCorner,
      description: "Conversations with pioneering women coaches changing the game",
    },
  ];

  const dramaContent = [
    {
      id: 1,
      title: "The Final Season",
      image: finalSeason,
      description: "A soccer team's journey to championship glory and personal growth",
    },
    {
      id: 2,
      title: "Powerplay",
      image: powerplay,
      description: "Drama series following a women's hockey team's fight for respect",
    },
    {
      id: 3,
      title: "Overtime",
      image: overtime,
      description: "Life, love, and basketball in a professional women's league",
    },
    {
      id: 4,
      title: "Full Court Press",
      image: fullCourtPress,
      description: "A rookie journalist covers the women's basketball beat",
    },
    {
      id: 5,
      title: "Team Spirit",
      image: teamSpirit,
      description: "College athletes balancing sports, academics, and relationships",
    },
  ];

  const userContent = [
    {
      id: 1,
      title: "My First Marathon",
      image: marathon,
      description: "Sarah's inspiring journey from couch to marathon finish line",
    },
    {
      id: 2,
      title: "Pickup Game Chronicles",
      image: pickupGame,
      description: "Weekly adventures at the local basketball court",
    },
    {
      id: 3,
      title: "Soccer Mom Diaries",
      image: soccerMom,
      description: "Balancing work, family, and a love for the beautiful game",
    },
    {
      id: 4,
      title: "Weekend Warriors",
      image: weekendWarriors,
      description: "Our recreational softball team's quest for glory",
    },
    {
      id: 5,
      title: "Gym Talk",
      image: gymTalk,
      description: "Real conversations about fitness, sports, and empowerment",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main>
        {/* Hero Section */}
        <div className="relative h-[60vh] min-h-[400px] overflow-hidden">
          <video
            src={heroVideo}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 container mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
              Where Women Lead
            </h1>
            <p className="text-xl text-foreground/90 max-w-2xl mb-6">
              Connect, share, and celebrate the power of women in sports
            </p>
            <button className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
              Join the Community
            </button>
          </div>
        </div>

        {/* Content Carousels */}
        <div className="container mx-auto py-12">
          <ContentCarousel title="Color & Coverage" items={unscriptedContent} />
          <ContentCarousel title="Drama" items={dramaContent} />
          <ContentCarousel title="Your Stories" items={userContent} />
        </div>
      </main>
    </div>
  );
};

export default Home;

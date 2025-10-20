import Navigation from "@/components/Navigation";
import ContentCarousel from "@/components/ContentCarousel";
import heroBanner from "@/assets/hero-banner.jpg";
import basketballImg from "@/assets/content-basketball.jpg";

const Home = () => {
  const unscriptedContent = [
    {
      id: 1,
      title: "Beyond the Court",
      image: basketballImg,
      description: "Follow three WNBA players as they navigate life on and off the court",
    },
    {
      id: 2,
      title: "Game Changers",
      image: basketballImg,
      description: "Documentary series celebrating women breaking barriers in sports",
    },
    {
      id: 3,
      title: "Training Day",
      image: basketballImg,
      description: "Behind-the-scenes look at elite female athletes' training routines",
    },
    {
      id: 4,
      title: "Rising Stars",
      image: basketballImg,
      description: "Young female athletes pursuing their dreams in competitive sports",
    },
    {
      id: 5,
      title: "Coach's Corner",
      image: basketballImg,
      description: "Conversations with pioneering women coaches changing the game",
    },
  ];

  const dramaContent = [
    {
      id: 1,
      title: "The Final Season",
      image: basketballImg,
      description: "A soccer team's journey to championship glory and personal growth",
    },
    {
      id: 2,
      title: "Powerplay",
      image: basketballImg,
      description: "Drama series following a women's hockey team's fight for respect",
    },
    {
      id: 3,
      title: "Overtime",
      image: basketballImg,
      description: "Life, love, and basketball in a professional women's league",
    },
    {
      id: 4,
      title: "Full Court Press",
      image: basketballImg,
      description: "A rookie journalist covers the women's basketball beat",
    },
    {
      id: 5,
      title: "Team Spirit",
      image: basketballImg,
      description: "College athletes balancing sports, academics, and relationships",
    },
  ];

  const userContent = [
    {
      id: 1,
      title: "My First Marathon",
      image: basketballImg,
      description: "Sarah's inspiring journey from couch to marathon finish line",
    },
    {
      id: 2,
      title: "Pickup Game Chronicles",
      image: basketballImg,
      description: "Weekly adventures at the local basketball court",
    },
    {
      id: 3,
      title: "Soccer Mom Diaries",
      image: basketballImg,
      description: "Balancing work, family, and a love for the beautiful game",
    },
    {
      id: 4,
      title: "Weekend Warriors",
      image: basketballImg,
      description: "Our recreational softball team's quest for glory",
    },
    {
      id: 5,
      title: "Gym Talk",
      image: basketballImg,
      description: "Real conversations about fitness, sports, and empowerment",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main>
        {/* Hero Section */}
        <div className="relative h-[60vh] min-h-[400px] overflow-hidden">
          <img
            src={heroBanner}
            alt="Women celebrating at sports event"
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
          <ContentCarousel title="Unscripted" items={unscriptedContent} />
          <ContentCarousel title="Drama" items={dramaContent} />
          <ContentCarousel title="User Stories" items={userContent} />
        </div>
      </main>
    </div>
  );
};

export default Home;

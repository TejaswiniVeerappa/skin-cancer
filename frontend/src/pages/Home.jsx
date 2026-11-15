import Hero from "../components/Hero";
import FeatureCard from "../components/FeatureCard";
import HowItWorks from "../components/HowItWorks";
import Doctors from "../components/Doctors";
import Statistics from "../components/Statistics";

function Home() {
  return (
    <>
      <Hero />
      <FeatureCard />
      <HowItWorks />
      <Doctors />
      <Statistics />
    </>
  );
}

export default Home;
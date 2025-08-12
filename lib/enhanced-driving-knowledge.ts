export const drivingExpertise = {
  roadSafety: {
    defensiveDriving: [
      "Always maintain a 3-second following distance",
      "Scan intersections before proceeding, even on green lights",
      "Check blind spots before changing lanes",
      "Use the SIPDE method: Search, Identify, Predict, Decide, Execute"
    ],
    hazardPerception: [
      "Watch for pedestrians at crosswalks and school zones",
      "Be alert for cyclists in bike lanes and intersections",
      "Identify potential door zones when passing parked cars",
      "Recognize signs of impaired or distracted drivers"
    ]
  },
  
  australianRoadRules: {
    rightOfWay: [
      "Give way to the right at unmarked intersections",
      "Pedestrians always have right of way at crosswalks",
      "Emergency vehicles have absolute right of way"
    ],
    speedLimits: [
      "School zones: 40km/h during school hours",
      "Residential areas: 50km/h unless signed otherwise",
      "Highways: 100-110km/h depending on signage"
    ]
  },
  
  practicalSkills: {
    parking: [
      "Parallel parking: Use reference points and mirrors",
      "Reverse parking: Safer exit, better visibility",
      "Angle parking: Check for pedestrians and other vehicles"
    ],
    maneuvers: [
      "Three-point turns: Check for traffic in both directions",
      "U-turns: Only where legally permitted and safe",
      "Hill starts: Use handbrake to prevent rolling back"
    ]
  },
  
  whyChooseUs: [
    "85% first-time pass rate vs 60% for self-taught drivers",
    "Dual-control cars ensure safety during learning",
    "Experienced instructors with 10+ years teaching",
    "Structured curriculum covering all test requirements",
    "Personalized feedback helps identify improvement areas",
    "Insurance discounts for professionally trained drivers",
    "Confidence building in real traffic situations"
  ]
};

export function getDrivingAdvice(topic: string): string {
  const lowerTopic = topic.toLowerCase();
  
  if (lowerTopic.includes('safe') || lowerTopic.includes('defensive')) {
    return `🛡️ **Defensive Driving Tips:**\n\n${drivingExpertise.roadSafety.defensiveDriving.map(tip => `• ${tip}`).join('\n')}\n\nThese skills are core to our training program!`;
  }
  
  if (lowerTopic.includes('park')) {
    return `🅿️ **Parking Mastery:**\n\n${drivingExpertise.practicalSkills.parking.map(tip => `• ${tip}`).join('\n')}\n\nWe practice all parking types in our lessons!`;
  }
  
  if (lowerTopic.includes('why') || lowerTopic.includes('benefit')) {
    return `🎯 **Why Choose Professional Lessons:**\n\n${drivingExpertise.whyChooseUs.slice(0, 4).map(reason => `• ${reason}`).join('\n')}\n\nReady to start your journey with us?`;
  }
  
  return "";
}
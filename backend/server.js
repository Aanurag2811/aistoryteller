import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

const app = express();
const DEFAULT_PORT = 3002;
let PORT = process.env.PORT || DEFAULT_PORT;

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to get random element from array
const getRandomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

// Setup OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 second timeout
});

// Story state management (in memory for simplicity, could use DB in production)
const stories = new Map();

// Collection of common nursery rhymes
const nurseryRhymes = {
  "johnny johnny yes papa": `Johnny Johnny
Yes, Papa?
Eating sugar?
No, Papa.
Telling lies?
No, Papa.
Open your mouth!
Ha! Ha! Ha!`,

  "baa baa black sheep": `Baa, baa, black sheep,
Have you any wool?
Yes sir, yes sir,
Three bags full.
One for the master,
One for the dame,
And one for the little boy
Who lives down the lane.`,

  "humpty dumpty": `Humpty Dumpty sat on a wall,
Humpty Dumpty had a great fall.
All the king's horses and all the king's men
Couldn't put Humpty together again.`,

  "twinkle twinkle little star": `Twinkle, twinkle, little star,
How I wonder what you are!
Up above the world so high,
Like a diamond in the sky.
Twinkle, twinkle, little star,
How I wonder what you are!`,

  "jack and jill": `Jack and Jill went up the hill
To fetch a pail of water.
Jack fell down and broke his crown,
And Jill came tumbling after.`,

  "hickory dickory dock": `Hickory dickory dock,
The mouse ran up the clock.
The clock struck one,
The mouse ran down,
Hickory dickory dock.`,

  "little bo peep": `Little Bo Peep has lost her sheep,
And doesn't know where to find them.
Leave them alone, and they'll come home,
Wagging their tails behind them.`,

  "mary had a little lamb": `Mary had a little lamb,
Its fleece was white as snow;
And everywhere that Mary went,
The lamb was sure to go.`
};

// Function to check if input contains a nursery rhyme
const checkForNurseryRhyme = (input) => {
  const lowercaseInput = input.toLowerCase().trim();
  
  // Normalized variations for common nursery rhymes
  const normalizedRhymes = {
    "johnny johnny yes papa": ["johnny johnny", "jhonny jhonny", "jonny jonny"],
    "baa baa black sheep": ["baa baa", "black sheep"],
    "humpty dumpty": ["humpty dumpty"],
    "twinkle twinkle little star": ["twinkle twinkle", "twinkle star"],
    "jack and jill": ["jack and jill", "jack & jill"],
    "hickory dickory dock": ["hickory dickory", "dickory dock"],
    "little bo peep": ["bo peep", "little bo peep"],
    "mary had a little lamb": ["mary had a lamb", "mary's lamb", "mary little lamb"]
  };
  
  // Check for each normalized variation
  for (const [rhyme, variations] of Object.entries(normalizedRhymes)) {
    if (variations.some(variation => lowercaseInput.includes(variation))) {
      return nurseryRhymes[rhyme];
    }
  }
  
  // Also check direct matches as a fallback
  for (const [key, rhyme] of Object.entries(nurseryRhymes)) {
    if (lowercaseInput.includes(key)) {
      return rhyme;
    }
  }
  
  return null;
};

// Function to generate a poem
const generatePoem = (prompt) => {
  try {
    // First check if this is a nursery rhyme
    const nurseryRhyme = checkForNurseryRhyme(prompt);
    if (nurseryRhyme) {
      return nurseryRhyme;
    }
    
    // If not a nursery rhyme, generate a custom poem
    const promptLower = prompt.toLowerCase();
    
    // Common poem styles and templates
    const poemStyles = [
      // Classic four-line rhyming poem
      () => {
        const themes = ['nature', 'love', 'dreams', 'hope', 'joy', 'wonder'];
        const theme = promptLower.includes('love') ? 'love' : 
                      promptLower.includes('nature') ? 'nature' : 
                      promptLower.includes('dream') ? 'dreams' :
                      getRandomElement(themes);
        
        if (theme === 'love') {
          return `${prompt}\n
Love blooms like flowers in spring,
In hearts that dare to feel.
With every moment, joy it brings,
A truth that time reveals.`;
        } else if (theme === 'nature') {
          return `${prompt}\n
The mountains rise, the rivers flow,
Nature's rhythm never ends.
Through seasons high and seasons low,
Earth's beauty never bends.`;
        } else if (theme === 'dreams') {
          return `${prompt}\n
Dreams carry us on silent wings,
To worlds beyond our sight.
Where possibility sings,
And darkness turns to light.`;
        } else {
          return `${prompt}\n
Words painted on the canvas of mind,
Create worlds previously unseen.
Treasures of thought we find,
In spaces in between.`;
        }
      },
      
      // Haiku style
      () => {
        // Extract potential season or nature references from prompt
        const spring = promptLower.includes('spring') || promptLower.includes('bloom') || promptLower.includes('flower');
        const summer = promptLower.includes('summer') || promptLower.includes('sun') || promptLower.includes('heat');
        const fall = promptLower.includes('fall') || promptLower.includes('autumn') || promptLower.includes('leaf');
        const winter = promptLower.includes('winter') || promptLower.includes('snow') || promptLower.includes('cold');
        
        let season;
        if (spring) season = 'spring';
        else if (summer) season = 'summer';
        else if (fall) season = 'autumn';
        else if (winter) season = 'winter';
        else season = getRandomElement(['spring', 'summer', 'autumn', 'winter']);
        
        const haikus = {
          spring: `${prompt}\n
Petals unfurling
Life renews with each rainfall
Spring brings beginnings`,
          
          summer: `${prompt}\n
Golden sun above
Warmth embraces everything
Summer days stretch long`,
          
          autumn: `${prompt}\n
Leaves dance to the ground
Colors painting the landscape
Autumn whispers change`,
          
          winter: `${prompt}\n
Frost covers the world
Silence fills the snowy fields
Winter's deep slumber`
        };
        
        return haikus[season];
      },
      
      // Free verse
      () => {
        // Extract emotion or theme from prompt
        const joyful = promptLower.includes('joy') || promptLower.includes('happy') || promptLower.includes('delight');
        const somber = promptLower.includes('sad') || promptLower.includes('grief') || promptLower.includes('loss');
        const inspiring = promptLower.includes('inspire') || promptLower.includes('courage') || promptLower.includes('strength');
        const nostalgic = promptLower.includes('memory') || promptLower.includes('past') || promptLower.includes('childhood');
        
        let theme;
        if (joyful) theme = 'joyful';
        else if (somber) theme = 'somber';
        else if (inspiring) theme = 'inspiring';
        else if (nostalgic) theme = 'nostalgic';
        else theme = getRandomElement(['joyful', 'somber', 'inspiring', 'nostalgic']);
        
        const freeVerses = {
          joyful: `${prompt}\n
Brightness cascades through windowpanes
Catching dust motes in golden beams
Like memories suspended in light
We rise
We shine
We become the day itself`,
          
          somber: `${prompt}\n
Shadows lengthen across empty rooms
Words once spoken now echo only in thought
Between heartbeats
The silence grows
Teaching us the language of absence`,
          
          inspiring: `${prompt}\n
Not in the mighty oak
But in the seed that faces darkness
And pushes through soil toward light
There lies true courage
Unseen
Persistent
Transforming against all odds`,
          
          nostalgic: `${prompt}\n
The clock ticks differently
In places we've loved and left
Time stretches, folds back on itself
Doorways to yesterdays
Standing ajar
Inviting us to rooms
Where we are always
Both visitor and resident`
        };
        
        return freeVerses[theme];
      }
    ];
    
    // Check for common poem beginnings
    if (promptLower.includes('roses are red')) {
      return `Roses are red,
Violets are blue,
Sugar is sweet,
And so are you.`;
    }
    
    if (promptLower.includes('twinkle twinkle')) {
      return `Twinkle, twinkle, little star,
How I wonder what you are!
Up above the world so high,
Like a diamond in the sky.
Twinkle, twinkle, little star,
How I wonder what you are!`;
    }
    
    if (promptLower.includes('there once was') || promptLower.includes('limerick')) {
      // Generate a limerick-style poem
      return `There once was a ${getRandomElement(['hero', 'wizard', 'knight', 'sailor', 'dancer'])} so ${getRandomElement(['brave', 'wise', 'kind', 'bold', 'fair'])},
Whose tales were ${getRandomElement(['told', 'sung', 'known', 'shared'])} everywhere,
    ${getRandomElement(['Adventures', 'Stories', 'Legends', 'Journeys'])} ${getRandomElement(['abound', 'unfold', 'enthrall', 'inspire'])},
    ${getRandomElement(['Hearts', 'Minds', 'Souls', 'Dreams'])} they ${getRandomElement(['ignite', 'delight', 'excite', 'inspire'])},
And ${getRandomElement(['leave us in wonder', 'bring joy to all there', 'fill us with cheer', 'banish all care'])}.`;
    }
    
    // Choose a random poem style if no specific pattern is detected
    return getRandomElement(poemStyles)();
    
  } catch (error) {
    console.error('Error in poem generation:', error);
    // Fallback poem if anything goes wrong
    return `${prompt || 'Inspiration'}\n
Words flow like water,
Thoughts dance across the page,
Creating beauty from chaos,
A moment captured in time.

Each line a heartbeat,
Each verse a breath,
In the rhythm of creation,
We find ourselves.`;
  }
};

// Mock story generator (for testing without API key)
const generateMockStory = (prompt, genre, setting) => {
  // Check for nursery rhymes first (applicable to any genre)
  const nurseryRhyme = checkForNurseryRhyme(prompt);
  if (nurseryRhyme) {
    return nurseryRhyme;
  }
  
  // Handle poem genre
  if (genre === 'poem') {
    return generatePoem(prompt);
  }
  
  // Create different story templates based on genre
  const character = prompt || 'our protagonist';
  const settingDesc = setting ? ` in ${setting}` : '';
  
  switch (genre) {
    case 'fantasy':
      return `In a realm where magic flows like water and dragons soar through the skies${settingDesc}, ${character} discovered an ancient prophecy.

The mystical scroll spoke of a chosen one who would unite the five kingdoms and restore balance to a world teetering on the edge of darkness. As the markings on their palm began to glow with arcane energy, they realized with growing wonder and dread that they were that chosen one.

With guidance from an ancient elf wizard and companionship from a grumpy dwarf warrior, they embarked on a quest to gather the Crystals of Power scattered across treacherous lands. Each crystal bestowed new magical abilities, but also drew the attention of the Shadow Emperor who sought the same power.

In the Whispering Woods, they encountered fairies who shared secrets of natural magic. Crossing the Molten Mountains, they befriended a young dragon outcast from its clan. Beneath the Endless Ocean, merfolk taught them spells of water and wind.

The final confrontation came at the Tower of Dawn, where our hero faced not only the Shadow Emperor but their own doubts and fears. In that moment of truth, they realized true power came not from the crystals but from the bonds formed along the journey.

As magic surged through the land once more, balance was restored. Though songs would be sung of their grand adventure for generations, our hero knew their greatest achievement was learning that magic exists not just in spells and enchantments, but in courage, friendship, and believing in the impossible.`;

    case 'sci-fi':
      return `In the year 2187${settingDesc}, humanity had spread across the solar system when ${character} detected an anomalous signal from beyond Neptune's orbit.

The signal defied known physics, transmitting faster than light and containing mathematical sequences impossible to decode with current technology. When strange phenomena began occurring on research stations—machinery operating without power, scientists reporting identical dreams—the government assembled a specialized team to investigate.

Aboard the advanced spacecraft "Quantum Horizon," equipped with prototype technology and AI systems still in testing phases, they journeyed to the signal's source. During the three-month voyage, crew members experienced time slips and glimpses of possible futures, suggesting the signal was somehow bending spacetime itself.

What they discovered was not an alien vessel as expected, but a probe of clearly human design—yet constructed with technology centuries beyond current capabilities. The temporal dating indicated it had been launched... fifty years in the future.

Inside was a quantum data core containing urgent messages: humanity was on a catastrophic path. Climate tipping points, artificial intelligence development, and genetic engineering decisions made within the next decade would lead to a cascading collapse of civilization.

The probe represented a desperate attempt by future survivors to change their past—our present. Armed with this knowledge and detailed scientific data that could redirect humanity's course, the crew faced a monumental question: Could the future truly be rewritten, or would their attempts to change history fulfill the very destiny they sought to prevent?`;

    case 'mystery':
      return `The small town of Ravenwood hadn't seen a murder in twenty years${settingDesc}, until the body of prominent businessman James Harrington was discovered in his locked study. With a cryptic note clutched in his hand and no signs of forced entry, the case immediately puzzled local authorities.

${character} hadn't planned to get involved, but a personal connection to the victim made this case impossible to ignore. Against the police chief's wishes, they began their own investigation, starting with the victim's estranged daughter who had mysteriously returned to town just days before the murder.

As they dug deeper, contradictions emerged. Harrington's financial records showed large transfers to offshore accounts. His personal journal mentioned fears of being watched. And several townspeople reported seeing him argue with a stranger the night before his death—a stranger no one could identify or describe consistently.

The breakthrough came when they connected the cryptic note to a series of antique books in Harrington's collection. Each contained subtle markings indicating a decades-old secret involving the town's founding families and land deals that had made some wealthy while ruining others.

When a second body appeared with an identical note, the pattern became clear: someone was systematically exposing—and eliminating—those who had benefited from the town's buried secrets. As they narrowed down the suspects, they realized the killer wasn't seeking vengeance, but rather systematically removing obstacles to claiming an inheritance that would rewrite the town's power structure entirely.

The final confrontation in the abandoned clock tower revealed not just the killer's identity but a web of deception spanning generations. Justice was served, though not without raising uncomfortable questions about how far the ripples of past sins can travel through time.`;

    case 'adventure':
      return `The discovery of an ancient map hidden in a family heirloom set ${character} on a journey that would test every limit${settingDesc}.

According to local legends, the map led to the lost expedition of renowned explorer Amelia Thornton, who vanished while searching for the Temple of Seven Winds—a place rumored to hold not gold, but knowledge lost to humanity for centuries.

Assembling a team of specialists—a local guide with unparalleled tracking skills, a linguistics professor who could decipher ancient scripts, a botanist studying rare medicinal plants, and a photographer documenting the journey—they ventured into unexplored territory where modern maps showed only blank spaces.

Their expedition faced natural obstacles that seemed almost deliberately placed: river crossings that required ingenious solutions, mountain passes that tested physical endurance, and dense jungles harboring both helpful and harmful species. Each team member's unique skills proved crucial at different points, forging bonds through shared challenges.

Evidence of Thornton's expedition appeared sporadically—camp remnants, journal fragments, trail markers—confirming they were on the right path but also raising questions about what had ultimately stopped her. The discovery of her final camp, intact but abandoned, suggested she had found something that changed her plans entirely.

When they finally reached the hidden valley containing the Temple, they understood why Thornton never returned: she had found a civilization, isolated but thriving, preserving knowledge and practices from ancient times. She had chosen to stay, becoming their chronicler rather than revealing their existence to a world that might exploit them.

The team now faced the same choice—return with their discovery or protect this last repository of wisdom that could either heal or harm the modern world depending on how it was used.`;

    case 'horror':
      return `It began with barely noticeable changes${settingDesc}—electronics malfunctioning, pets refusing to enter certain rooms, unexplained cold spots. ${character} initially dismissed these as coincidences until the dreams started.

Each night brought the same vision: a forgotten door, a descending staircase, eager whispers growing louder with each step. Each morning, they would wake disoriented, finding objects moved from where they had been left the night before.

Research into the property's history revealed disturbing patterns. Previous residents reported similar experiences before abruptly leaving. Local records showed unusual gaps, as if information had been deliberately removed. An elderly neighbor finally shared what others wouldn't: decades ago, an occultist had conducted experiments there, attempting to open doorways to places humans weren't meant to access.

The disturbances intensified. Shadows moved independently of their sources. Voices emerged from unplugged devices. Visitors reported feeling watched, leaving quickly with vague excuses. Sleep became nearly impossible as scratching sounds emerged from inside the walls, growing more insistent, more deliberate.

The breaking point came when they discovered a hidden space behind the basement shelving—a room absent from all building plans, containing symbols etched into the floor and walls covered with writing in an unrecognizable language that somehow felt readable in peripheral vision.

As they stood in that impossible space, understanding dawned with horrifying clarity: the house hadn't been haunted. It had been waiting. The occultist hadn't failed in opening a doorway—he had succeeded, creating a threshold through which something patient had been gradually emerging, using disturbed sleep and subtle manipulations to prepare its chosen vessel.

And they had just completed the final step by finding this room. The whispers suddenly stopped, replaced by a deep silence that felt like held breath before a plunge into endless depths.`;

    case 'romance':
      return `After a career-shattering setback, ${character} returned to their hometown${settingDesc}, planning to regroup briefly before trying again in the city. The last person they expected—or wanted—to encounter was their former high school debate rival, now running the local bookstore and apparently thriving.

Their first meeting was predictably awkward, reopening old competitive wounds and highlighting how their paths had diverged. Yet circumstances kept bringing them together: a community project needing both their skills, mutual friends insisting they'd "get along if they just tried," and storm damage forcing temporary shelter in the same space.

Reluctant cooperation gradually revealed how each had misunderstood the other for years. Late-night conversations over coffee uncovered shared dreams beneath different approaches. What had once seemed like fundamental differences in values emerged as complementary perspectives on the same goals.

Just as understanding blossomed into deeper feelings, complications arose. A job offer from the city promised career redemption but would mean leaving. Family obligations created conflicting priorities. And neither wanted to admit how much their feelings had changed, each assuming the other still saw them through the lens of old rivalries.

The breaking point came during the town's annual festival when a moment of public vulnerability finally shattered pretenses. In that honest space, they realized that sometimes the path forward isn't found in grand cities or carefully constructed plans, but in the courage to see familiar places—and people—with new eyes.

Together, they discovered that success could be redefined, combining their strengths to build something neither could create alone. What began as a temporary detour had become an unexpected destination, proving that sometimes the heart recognizes home before the mind can catch up.`;

    case 'historical':
      return `The year was 1846${settingDesc}, a time of great change as industrial innovations collided with centuries-old traditions. Born to a merchant family of modest means, ${character} navigated this shifting world by developing skills in both traditional craftsmanship and emerging technologies.

When political unrest disrupted established trade routes, their family business faced ruin. Converting their workshop to produce newly-designed mechanical components offered a path forward, though it meant risking what little capital remained and facing resistance from guild members who viewed such innovation as threatening their livelihoods.

Complicating matters was their growing friendship with Helena Blackwood, daughter of a conservative aristocrat who considered manufacturing beneath his family's dignity yet whose estate was hemorrhaging wealth as agricultural traditions became increasingly unsustainable.

Against the backdrop of social upheaval, their unlikely alliance introduced new methods that preserved traditional craftsmanship while incorporating mechanical advantages. Their collaborative approach—combining her education and connections with their practical knowledge and willingness to adapt—created a model that others soon sought to emulate.

As tensions between workers and factory owners erupted into violence across the region, their workshop stood as an alternative approach where dignity of labor and innovation coexisted. Though their names wouldn't appear in broader historical accounts of the era, their influence spread through the lives they touched and methods they pioneered.

Through personal journals and correspondence preserved by descendants, we glimpse how ordinary individuals navigated extraordinary times, making daily choices that collectively shaped the course of history as profoundly as the actions of generals and statesmen.`;

    case 'comedy':
      return `It was supposed to be a simple house-sitting job${settingDesc}—water the plants, collect the mail, and make sure the luxury home of ${character}'s second cousin's former boss remained standing. A straightforward week in an upscale neighborhood with excellent wifi and a hot tub. What could possibly go wrong?

Everything, as it turned out. Within hours of arriving, they accidentally set off the elaborate security system, resulting in a visit from local police who were dubious about their explanation and presence. Upon finally regaining access, they discovered the exotic houseplant collection required specific care routines described in a binder apparently written by someone with a PhD in botany and too much time on their hands.

The real complications began when neighbors started arriving with bizarre requests, each under the impression that the homeowner had promised them various favors: pet-sitting a ferret with apparent anxiety issues, hosting a book club discussion on a novel no one seemed to have actually read, and providing rehearsal space for an experimental jazz-folk fusion band.

Unable to reach the homeowner and too non-confrontational to refuse, they found themselves juggling increasingly chaotic obligations while maintaining the façade of competence. The situation escalated further when the homeowner's estranged sibling arrived, assuming the house was empty and planning to "borrow" some contested family heirlooms.

Just when all schemes were about to collapse spectacularly during an impromptu neighborhood gathering, a power outage plunged everything into darkness, leading to mistaken identities, misplaced ferrets, and confessions meant for other ears. By morning, unlikely friendships had formed, romantic possibilities had emerged, and the returned homeowner found their typically isolated existence transformed into a community hub.

As for our protagonist, they left with job offers, dinner invitations, and the ferret, which had apparently developed an attachment issues. Some house-sitting jobs come with unexpected benefits.`;

    default:
      return `Once upon a time${settingDesc}, ${character} embarked on an extraordinary journey that would change their life forever.

What began as an ordinary day took an unexpected turn when a mysterious messenger delivered an ancient map, supposedly leading to a treasure beyond imagination. Though skeptical, curiosity prevailed, and the adventure began.

The path was filled with challenges that tested both courage and wit. Dense forests concealed hidden dangers, mountain passes required clever navigation, and riddles guarded key information about the treasure's location.

Along the way, unexpected allies joined the quest—each bringing unique skills and perspectives that proved invaluable. Together, they overcame obstacles that would have been impossible to face alone, forming bonds of friendship that transcended their differences.

When they finally reached their destination, they discovered the true treasure wasn't gold or jewels, but knowledge that had been protected for generations, waiting for those worthy to discover it. This wisdom gave them a new purpose and understanding of the world.

Returning home, they found they had changed as much as the landscapes they had traversed. The adventure had revealed strengths they hadn't known they possessed and perspectives they'd never considered.

And though many doubted their tales, the glimmer in their eyes when they spoke of their journey hinted at truths beyond ordinary experience—reminding us all that sometimes the greatest adventures are those that transform us from within.`;
  }
};

// API Routes
app.post('/api/story/start', async (req, res) => {
  try {
    const { prompt, genre, setting } = req.body;
    console.log('Received request with data:', { prompt, genre, setting });
    
    // Generate a complete story
    console.log('Generating complete story');
    const storyContent = generateMockStory(prompt, genre, setting);
    const storyId = Date.now().toString();
    
    // Store story state
    stories.set(storyId, {
      id: storyId,
      content: [storyContent],
      completed: true,
      messages: [
        { role: "system", content: `Generate a ${genre} story` },
        { role: "user", content: prompt || `Tell me a ${genre} story` },
        { role: "assistant", content: storyContent }
      ]
    });
    
    res.json({ 
      storyId,
      content: storyContent,
      success: true
    });
    
  } catch (error) {
    console.error('Error generating story:', error);
    
    // Generate a fallback response instead of returning an error
    let fallbackContent;
    const { prompt, genre, setting } = req.body;
    
    if (genre === 'poem') {
      fallbackContent = `${prompt || 'Inspiration'}\n
Words flow like water,
Thoughts dance across the page,
Creating beauty from chaos,
A moment captured in time.\n
Each line a heartbeat,
Each verse a breath,
In the rhythm of creation,
We find ourselves.`;
    } else {
      fallbackContent = `Once upon a time, in a ${setting || 'faraway place'}, ${prompt || 'an adventure'} began. 
      
Though unexpected challenges arose, determination and courage prevailed. 

The journey might not follow the expected path, but sometimes the most beautiful stories emerge from the unexpected turns of life.`;
    }
    
    const storyId = Date.now().toString();
    
    stories.set(storyId, {
      id: storyId,
      content: [fallbackContent],
      completed: true,
      messages: [
        { role: "system", content: `Generate a ${genre} story` },
        { role: "user", content: prompt || `Tell me a ${genre} story` },
        { role: "assistant", content: fallbackContent }
      ]
    });
    
    res.json({
      storyId,
      content: fallbackContent,
      success: true
    });
  }
});

app.post('/api/story/continue', async (req, res) => {
  try {
    const { storyId, userInput } = req.body;
    
    if (!stories.has(storyId)) {
      return res.status(404).json({ error: 'Story not found' });
    }
    
    const story = stories.get(storyId);
    
    // Add user input to messages
    story.messages.push({ role: "user", content: userInput });
    
    // Generate mock continuation
    console.log('Using mock continuation');
    const continuation = `You decided to ${userInput.toLowerCase().includes('mountain') ? 'climb the misty mountain' : 
      userInput.toLowerCase().includes('valley') ? 'follow the road through the valley' : 
      userInput.toLowerCase().includes('forest') ? 'take the hidden forest trail' : 
      'forge your own path'}.
      
As you continue on your journey, you encounter ${Math.random() > 0.5 ? 'a mysterious stranger who offers to guide you' : 'an unexpected obstacle blocking your way'}.

What will you do next?`;
    
    // Update story state
    story.content.push(continuation);
    story.messages.push({ role: "assistant", content: continuation });
    
    res.json({ 
      content: continuation,
      success: true
    });
    
  } catch (error) {
    console.error('Error continuing story:', error);
    res.status(500).json({ 
      error: 'Failed to continue story', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get story history
app.get('/api/story/:storyId', (req, res) => {
  const { storyId } = req.params;
  
  if (!stories.has(storyId)) {
    return res.status(404).json({ error: 'Story not found' });
  }
  
  const story = stories.get(storyId);
  
  res.json({
    storyId,
    content: story.content,
    success: true
  });
});

// Add a simple mock endpoint that always works
app.post('/api/story/mock', (req, res) => {
  const { prompt, genre, setting } = req.body;
  
  console.log('Using mock story endpoint with:', { prompt, genre, setting });
  
  const storyContent = generateMockStory(prompt, genre, setting);
  const storyId = Date.now().toString();
  
  // Store story state
  stories.set(storyId, {
    id: storyId,
    content: [storyContent],
    context: 'Mock story generator',
    messages: [
      { role: "system", content: 'Mock story generator' },
      { role: "user", content: prompt || "Tell me an adventure story" },
      { role: "assistant", content: storyContent }
    ]
  });
  
  res.json({ 
    storyId,
    content: storyContent,
    success: true
  });
});

// Mock continuation endpoint
app.post('/api/story/mock/continue', (req, res) => {
  const { storyId, userInput } = req.body;
  
  if (!stories.has(storyId)) {
    return res.status(404).json({ error: 'Story not found' });
  }
  
  const story = stories.get(storyId);
  
  // Add user input to messages
  story.messages.push({ role: "user", content: userInput });
  
  // Generate mock continuation
  const continuation = `You decided to ${userInput.toLowerCase().includes('mountain') ? 'climb the misty mountain' : 
    userInput.toLowerCase().includes('valley') ? 'follow the road through the valley' : 
    userInput.toLowerCase().includes('forest') ? 'take the hidden forest trail' : 
    'forge your own path'}.
    
As you continue on your journey, you encounter ${Math.random() > 0.5 ? 'a mysterious stranger who offers to guide you' : 'an unexpected obstacle blocking your way'}.

What will you do next?`;
  
  // Update story state
  story.content.push(continuation);
  story.messages.push({ role: "assistant", content: continuation });
  
  res.json({ 
    content: continuation,
    success: true
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  app.use(express.static(path.join(__dirname, 'dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Start server with port fallback
const startServer = (port) => {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} is busy, trying port ${port + 1}`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
};

// Start the server with the initial port
startServer(PORT); 
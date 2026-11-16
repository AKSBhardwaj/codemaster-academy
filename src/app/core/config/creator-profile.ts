import { publicPath } from '../../../content-schema/site-constants';

/** Creator details shared by the About page, footer and search metadata. */
export const CREATOR_PROFILE = {
  name: 'Alok Kumar Sharma',
  photoPath: publicPath('/images/alok-kumar-sharma.webp'),
  role: 'Software Engineer & Full-Stack Developer',
  experience: '6+',
  employer: 'Tata Consultancy Services (TCS)',
  motto: 'Build. Learn. Innovate. Repeat.',
  skills: [
    {
      title: 'Frontend development',
      description: 'The pages you see and use.',
      tools: ['Angular', 'TypeScript', 'JavaScript', 'Bootstrap', 'PrimeNG'],
    },
    {
      title: 'Backend development',
      description: 'The code that works behind the pages.',
      tools: ['Node.js', 'Python', 'Django', 'REST APIs'],
    },
    {
      title: 'Databases',
      description: 'Tools that store and find information.',
      tools: ['MySQL', 'MariaDB', 'Microsoft SQL Server'],
    },
    {
      title: 'Artificial intelligence (AI)',
      description: 'Exploring tools that create content and help with tasks.',
      tools: ['Generative AI', 'Large language models (LLMs)', 'Automation'],
    },
  ],
} as const;

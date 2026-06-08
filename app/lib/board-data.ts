export interface BoardSocial {
  type: string;
  url: string;
  color?: string;
}

export interface BoardMember {
  name: string;
  title: string;
  image: string;
  socials: BoardSocial[];
}

export const boardOfDirectors: BoardMember[] = [
  {
    name: 'Umar Sear',
    title: 'President',
    image: 'https://mhma.us/wp-content/uploads/2024/01/Umar-Sear-300-x-350.jpg',
    socials: [{ type: 'email', url: 'mailto:umar.sear@mhma.info', color: '#000000' }],
  },
  {
    name: 'Asad Siddique',
    title: 'Secretary',
    image: 'https://mhma.us/wp-content/uploads/2024/01/Asad-Siddique-300-x-350.jpg',
    socials: [{ type: 'email', url: 'mailto:asad.siddique@mhma.info', color: '#000000' }],
  },
  {
    name: 'Saqib Malik',
    title: 'Treasurer',
    image: 'https://mhma.us/wp-content/uploads/2024/01/Saqib-Malik-300-x-350.jpg',
    socials: [{ type: 'email', url: 'mailto:saqib.malik@mhma.info', color: '#000000' }],
  },
  {
    name: 'Mohamed Mohamed',
    title: 'Director',
    image: 'https://mhma.us/wp-content/uploads/2025/11/Mohamed-Mohamed.jpg',
    socials: [{ type: 'email', url: 'mailto:asif.alvi@mhma.info', color: '#000000' }],
  },
  {
    name: 'Sadia Khan',
    title: 'Director',
    image: 'https://mhma.us/wp-content/uploads/2024/01/Sadia-Khan-300-x-350.jpg',
    socials: [{ type: 'email', url: 'mailto:sadia.khan@mhma.info', color: '#000000' }],
  },
  {
    name: 'Sarfaraz Shaikh',
    title: 'Director',
    image: 'https://mhma.us/wp-content/uploads/2024/01/Sarfaraz-Shaik-300-x-350.jpg',
    socials: [{ type: 'email', url: 'mailto:sarfaraz.shaikh@mhma.info', color: '#000000' }],
  },
  {
    name: 'Mohamed Basha',
    title: 'Director',
    image: 'https://mhma.us/wp-content/uploads/2024/01/Mohammad-Basha-300-x-350-257x300.jpg',
    socials: [{ type: 'email', url: 'mailto:mohamed.basha@mhma.info', color: '#000000' }],
  },
  {
    name: 'Oussama Saafien',
    title: 'Director',
    image: 'https://mhma.us/wp-content/uploads/2024/01/Oussama-Saafien-300-x-350.jpg',
    socials: [{ type: 'email', url: 'mailto:oussama.saafien@mhma.info', color: '#000000' }],
  },
  {
    name: 'Faisal Shahid',
    title: 'Director',
    image: 'https://mhma.us/wp-content/uploads/2024/08/Syed-Shahid-profile.webp',
    socials: [{ type: 'email', url: 'mailto:faisal.shahid@mhma.info', color: '#000000' }],
  },
];

export const boardOfTrustees: BoardMember[] = [
  {
    name: 'Asad Jafri',
    title: 'Director',
    image: 'https://mhma.us/wp-content/uploads/2024/01/Asad-Jafri-300-x-350.jpg',
    socials: [{ type: 'email', url: 'mailto:asad.jafri@mhma.info', color: '#000000' }],
  },
  {
    name: 'Zafar Khan',
    title: 'Trustee',
    image: 'https://mhma.us/wp-content/uploads/2024/01/Zafar-Khan-300-x-350.jpg',
    socials: [{ type: 'email', url: 'mailto:zafar.khan@mhma.info', color: '#000000' }],
  },
  {
    name: 'Kanishka Ramyar',
    title: 'Trustee',
    image: 'https://mhma.us/wp-content/uploads/2025/11/Kanishka-Ramyar.jpg',
    socials: [{ type: 'email', url: 'mailto:kanishka.ramyar@mhma.info', color: '#000000' }],
  },
  {
    name: 'Shahzad Ali',
    title: 'Trustee',
    image: 'https://mhma.us/wp-content/uploads/2024/01/Shahzad-Ali-300-x-350.jpg',
    socials: [{ type: 'email', url: 'mailto:shahzad.ali@mhma.info', color: '#000000' }],
  },
  {
    name: 'Tariq Khan',
    title: 'Trustee',
    image: 'https://mhma.us/wp-content/uploads/2024/01/Tariq-Khan-300-x-350.jpg',
    socials: [{ type: 'email', url: 'mailto:tariq.khan@mhma.info', color: '#000000' }],
  },
  {
    name: 'Owais Khalid',
    title: 'Trustee',
    image: 'https://mhma.us/wp-content/uploads/2024/01/Owais-Khalid-300-x-350.jpg',
    socials: [{ type: 'email', url: 'mailto:owais.khalid@mhma.info', color: '#000000' }],
  },
  {
    name: 'Nazeer Shaik',
    title: 'Trustee',
    image: 'https://mhma.us/wp-content/uploads/2024/01/Nazeer-Shaik-300-x-350.jpg',
    socials: [{ type: 'email', url: 'mailto:nazeer.shaik@mhma.info', color: '#000000' }],
  },
];

export function getBoardMember(name: string): BoardMember | undefined {
  return [...boardOfDirectors, ...boardOfTrustees].find(m => m.name === name);
}

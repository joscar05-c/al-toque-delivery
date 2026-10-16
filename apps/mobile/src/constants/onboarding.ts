import type { ImageSourcePropType } from 'react-native';

export interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  image: ImageSourcePropType;
}

export const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Diverse & sparkling food.',
    description:
      'We use the best local ingredients to create fresh and delicious food and drinks.',
    image: require('../../assets/images/onboarding/onboarding-1.png'),
  },
  {
    id: '2',
    title: 'Free shipping on all orders',
    description:
      'Free shipping on the primary order whilst the usage of CaPay fee method.',
    image: require('../../assets/images/onboarding/onboarding-2.png'),
  },
  {
    id: '3',
    title: '+24K Restaurants',
    description:
      'Easily find your favorite food and have it delivered in record time.',
    image: require('../../assets/images/onboarding/onboarding-3.png'),
  },
];

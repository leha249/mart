export interface Product {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  category: string;
  image: string;
  tag?: string;
  sizes?: string[];
  colors?: string[];
  description?: string;
  rating?: number;
  reviews?: number;
}

export const products: Product[] = [
  {
    id: 1,
    name: 'Oversized Wool Coat',
    price: 24900,
    oldPrice: 32900,
    category: 'Outerwear',
    image: 'https://picsum.photos/seed/coat/800/1000',
    tag: 'SALE',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['#1a1a1a', '#8b7355', '#4a5d5a'],
    description:
      'Свободный шерстяной палто прямого кроя. Натуральная шерсть 80%, кашемир 20%. Утеплённая подкладка, глубокие карманы. Идеально для холодного сезона.',
    rating: 4.9,
    reviews: 128,
  },
  {
    id: 2,
    name: 'Relaxed Linen Shirt',
    price: 8900,
    category: 'Shirts',
    image: 'https://picsum.photos/seed/shirt/800/1000',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['#f5f5dc', '#ffffff', '#1a1a1a'],
    description:
      'Рубашка из 100% итальянского льна. Свободный крой, перламутровые пуговицы. Дышит и не мнётся — идеально для лета.',
    rating: 4.7,
    reviews: 94,
  },
  {
    id: 3,
    name: 'Tailored Wide Pants',
    price: 12400,
    category: 'Pants',
    image: 'https://picsum.photos/seed/pants/800/1000',
    tag: 'NEW',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['#1a1a1a', '#d4d4d4', '#8b7355'],
    description:
      'Широкие брюки с завышенной посадкой. Плотный костюмный хлопок с эластаном. Идеальная посадка, струящийся силуэт.',
    rating: 4.8,
    reviews: 156,
  },
  {
    id: 4,
    name: 'Knit Turtleneck',
    price: 9800,
    category: 'Knitwear',
    image: 'https://picsum.photos/seed/knit/800/1000',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['#8b7355', '#1a1a1a', '#7a3f3f'],
    description:
      'Водолазка крупной вязки. Мериносовая шерсть extra fine. Мягкая, не колется, держит форму.',
    rating: 4.9,
    reviews: 213,
  },
  {
    id: 5,
    name: 'Leather Tote Bag',
    price: 18500,
    category: 'Accessories',
    image: 'https://picsum.photos/seed/bag/800/1000',
    sizes: ['ONE SIZE'],
    colors: ['#1a1a1a', '#8b7355'],
    description:
      'Сумка-тоут из натуральной итальянской кожи. Внутренний органайзер, съёмный клатч. Ручная работа.',
    rating: 5.0,
    reviews: 87,
  },
  {
    id: 6,
    name: 'Minimal Sneakers',
    price: 15600,
    category: 'Footwear',
    image: 'https://picsum.photos/seed/sneaker/800/1000',
    tag: 'NEW',
    sizes: ['36', '37', '38', '39', '40', '41', '42'],
    colors: ['#ffffff', '#1a1a1a'],
    description:
      'Минималистичные кеды из веганской кожи. Натуральная каучуковая подошва, мягкая амортизация.',
    rating: 4.8,
    reviews: 342,
  },
];

export const categories = ['Все', ...Array.from(new Set(products.map((p) => p.category)))];
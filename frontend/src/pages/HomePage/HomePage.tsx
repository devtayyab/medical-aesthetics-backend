import React, { useEffect } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Search, MapPin, Star, TrendingUp } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { Input } from '@/components/atoms/Input/Input';
import { Card } from '@/components/atoms/Card/Card';
import { ClinicCard } from '@/components/molecules/ClinicCard/ClinicCard';
import { fetchFeaturedClinics } from '@/store/slices/clinicsSlice';
import type { RootState, AppDispatch } from '@/store';
import type { Clinic } from '@/types';

const heroStyle = css`
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  color: var(--color-white);
  padding: var(--spacing-3xl) 0;
  text-align: center;
`;

const heroContentStyle = css`
  max-width: 800px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
`;

const heroTitleStyle = css`
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-lg);
  line-height: var(--line-height-tight);
  
  @media (max-width: 768px) {
    font-size: var(--font-size-3xl);
  }
`;

const heroSubtitleStyle = css`
  font-size: var(--font-size-xl);
  margin-bottom: var(--spacing-2xl);
  opacity: 0.9;
  line-height: var(--line-height-normal);
  
  @media (max-width: 768px) {
    font-size: var(--font-size-lg);
  }
`;

const searchBoxStyle = css`
  background-color: var(--color-white);
  border-radius: var(--radius-2xl);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-xl);
  max-width: 600px;
  margin: 0 auto;
`;

const searchFormStyle = css`
  display: flex;
  gap: var(--spacing-md);
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const sectionStyle = css`
  padding: var(--spacing-3xl) 0;
`;

const containerStyle = css`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
  
  @media (min-width: 768px) {
    padding: 0 var(--spacing-xl);
  }
`;

const sectionHeaderStyle = css`
  text-align: center;
  margin-bottom: var(--spacing-2xl);
`;

const sectionTitleStyle = css`
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
  margin-bottom: var(--spacing-md);
`;

const sectionSubtitleStyle = css`
  font-size: var(--font-size-lg);
  color: var(--color-gray-600);
  max-width: 600px;
  margin: 0 auto;
`;

const categoriesGridStyle = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
`;

const categoryCardStyle = css`
  text-align: center;
  padding: var(--spacing-xl);
  cursor: pointer;
  transition: transform var(--transition-fast);
  
  &:hover {
    transform: translateY(-4px);
  }
`;

const categoryIconStyle = css`
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--spacing-md);
  color: var(--color-white);
`;

const categoryTitleStyle = css`
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-900);
  margin-bottom: var(--spacing-sm);
`;

const categoryDescriptionStyle = css`
  font-size: var(--font-size-sm);
  color: var(--color-gray-600);
`;

const clinicsGridStyle = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-xl);
`;

const statsStyle = css`
  background-color: var(--color-gray-50);
  padding: var(--spacing-2xl) 0;
`;

const statsGridStyle = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-xl);
  text-align: center;
`;

const statNumberStyle = css`
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-sm);
`;

const statLabelStyle = css`
  font-size: var(--font-size-lg);
  color: var(--color-gray-600);
`;

const categories = [
  {
    id: 'facial',
    name: 'Facial Treatments',
    description: 'Rejuvenating facials and skincare',
    icon: '✨',
  },
  {
    id: 'massage',
    name: 'Massage Therapy',
    description: 'Relaxing and therapeutic massages',
    icon: '💆',
  },
  {
    id: 'nails',
    name: 'Nail Care',
    description: 'Manicures, pedicures, and nail art',
    icon: '💅',
  },
  {
    id: 'hair',
    name: 'Hair Services',
    description: 'Cuts, styling, and treatments',
    icon: '💇',
  },
  {
    id: 'body',
    name: 'Body Treatments',
    description: 'Body wraps, scrubs, and contouring',
    icon: '🧴',
  },
  {
    id: 'laser',
    name: 'Laser Treatments',
    description: 'Hair removal and skin resurfacing',
    icon: '⚡',
  },
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const { featuredClinics, isLoading } = useSelector((state: RootState) => state.clinics);
  
  const [searchQuery, setSearchQuery] = React.useState('');
  const [location, setLocation] = React.useState('');

  useEffect(() => {
    dispatch(fetchFeaturedClinics());
  }, [dispatch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (location) params.set('location', location);
    navigate(`/search?${params.toString()}`);
  };

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/search?category=${categoryId}`);
  };

  const handleClinicSelect = (clinic: Clinic) => {
    navigate(`/clinic/${clinic.id}`);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className={heroStyle}>
        <div className={heroContentStyle}>
          <h1 className={heroTitleStyle}>
            Discover Your Perfect Beauty Experience
          </h1>
          <p className={heroSubtitleStyle}>
            Book appointments with top-rated beauty clinics and wellness centers near you
          </p>
          
          <div className={searchBoxStyle}>
            <form onSubmit={handleSearch} className={searchFormStyle}>
              <Input
                placeholder="Search treatments, services..."
                leftIcon={<Search size={16} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
              />
              <Input
                placeholder="Enter location"
                leftIcon={<MapPin size={16} />}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                fullWidth
              />
              <Button type="submit" size="lg">
                Search
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className={sectionStyle}>
        <div className={containerStyle}>
          <div className={sectionHeaderStyle}>
            <h2 className={sectionTitleStyle}>Popular Categories</h2>
            <p className={sectionSubtitleStyle}>
              Explore our wide range of beauty and wellness services
            </p>
          </div>
          
          <div className={categoriesGridStyle}>
            {categories.map((category) => (
              <Card
                key={category.id}
                variant="outlined"
                hoverable
                className={categoryCardStyle}
                onClick={() => handleCategoryClick(category.id)}
              >
                <div className={categoryIconStyle}>
                  <span style={{ fontSize: '24px' }}>{category.icon}</span>
                </div>
                <h3 className={categoryTitleStyle}>{category.name}</h3>
                <p className={categoryDescriptionStyle}>{category.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Clinics Section */}
      <section className={sectionStyle}>
        <div className={containerStyle}>
          <div className={sectionHeaderStyle}>
            <h2 className={sectionTitleStyle}>Featured Clinics</h2>
            <p className={sectionSubtitleStyle}>
              Discover top-rated beauty clinics and wellness centers
            </p>
          </div>
          
          <div className={clinicsGridStyle}>
            {featuredClinics.map((clinic) => (
              <ClinicCard
                key={clinic.id}
                clinic={clinic}
                onSelect={handleClinicSelect}
              />
            ))}
          </div>
          
          {featuredClinics.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: 'var(--spacing-2xl)' }}>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/search')}
              >
                View All Clinics
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className={statsStyle}>
        <div className={containerStyle}>
          <div className={statsGridStyle}>
            <div>
              <div className={statNumberStyle}>10,000+</div>
              <div className={statLabelStyle}>Happy Clients</div>
            </div>
            <div>
              <div className={statNumberStyle}>500+</div>
              <div className={statLabelStyle}>Partner Clinics</div>
            </div>
            <div>
              <div className={statNumberStyle}>50+</div>
              <div className={statLabelStyle}>Treatment Types</div>
            </div>
            <div>
              <div className={statNumberStyle}>4.9</div>
              <div className={statLabelStyle}>Average Rating</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
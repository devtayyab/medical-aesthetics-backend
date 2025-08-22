import React, { useEffect } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Search, MapPin, Star, TrendingUp, CheckCircle, Calendar, UserCheck } from 'lucide-react';
import { Button } from '@/components/atoms/Button/Button';
import { Input } from '@/components/atoms/Input/Input';
import { Card } from '@/components/atoms/Card/Card';
import { ClinicCard } from '@/components/molecules/ClinicCard/ClinicCard';
import { fetchFeaturedClinics } from '@/store/slices/clinicsSlice';
import type { RootState, AppDispatch } from '@/store';
import type { Clinic } from '@/types';

const heroStyle = css`
  background: linear-gradient(135deg, rgba(248, 249, 250, 0.9) 0%, rgba(255, 255, 255, 0.95) 100%),
              url('https://images.pexels.com/photos/4173251/pexels-photo-4173251.jpeg?auto=compress&cs=tinysrgb&w=1200') center/cover;
  color: var(--color-medical-text);
  padding: var(--spacing-4xl) 0;
  min-height: 70vh;
  display: flex;
  align-items: center;
  text-align: center;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.85);
    z-index: 1;
  }
`;

const heroContentStyle = css`
  position: relative;
  z-index: 2;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
`;

const heroTitleStyle = css`
  font-size: var(--font-size-5xl);
  font-weight: var(--font-weight-extrabold);
  margin-bottom: var(--spacing-lg);
  line-height: var(--line-height-tight);
  color: var(--color-medical-text);
  
  @media (max-width: 768px) {
    font-size: var(--font-size-4xl);
  }
`;

const heroSubtitleStyle = css`
  font-size: var(--font-size-xl);
  margin-bottom: var(--spacing-2xl);
  color: var(--color-medical-text-light);
  line-height: var(--line-height-normal);
  font-weight: var(--font-weight-normal);
  
  @media (max-width: 768px) {
    font-size: var(--font-size-lg);
  }
`;

const searchBoxStyle = css`
  background-color: var(--color-white);
  border-radius: var(--radius-3xl);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-2xl);
  max-width: 600px;
  margin: 0 auto;
  border: 1px solid var(--color-medical-border);
`;

const searchFormStyle = css`
  display: flex;
  gap: var(--spacing-md);
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const sectionStyle = css`
  padding: var(--spacing-4xl) 0;
  background-color: var(--color-medical-bg);
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
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-medical-text);
  margin-bottom: var(--spacing-md);
`;

const sectionSubtitleStyle = css`
  font-size: var(--font-size-lg);
  color: var(--color-medical-text-light);
  max-width: 600px;
  margin: 0 auto;
  font-weight: var(--font-weight-normal);
`;

const stepsStyle = css`
  background-color: var(--color-white);
  padding: var(--spacing-4xl) 0;
`;

const stepsGridStyle = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-2xl);
  margin-top: var(--spacing-2xl);
`;

const stepCardStyle = css`
  text-align: center;
  padding: var(--spacing-2xl);
  background: var(--color-white);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-card);
  border: 1px solid var(--color-medical-border);
  transition: all var(--transition-normal);
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: var(--shadow-xl);
  }
`;

const stepIconStyle = css`
  width: 80px;
  height: 80px;
  background: var(--color-primary);
  border-radius: var(--radius-2xl);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--spacing-lg);
  color: var(--color-white);
  box-shadow: var(--shadow-button);
`;

const stepTitleStyle = css`
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-medical-text);
  margin-bottom: var(--spacing-sm);
`;

const stepDescriptionStyle = css`
  font-size: var(--font-size-base);
  color: var(--color-medical-text-light);
  line-height: var(--line-height-relaxed);
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
  background: var(--color-white);
  border-radius: var(--radius-2xl);
  border: 1px solid var(--color-medical-border);
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: var(--shadow-lg);
  }
`;

const categoryIconStyle = css`
  width: 60px;
  height: 60px;
  background: var(--color-primary);
  border-radius: var(--radius-2xl);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--spacing-md);
  color: var(--color-white);
  box-shadow: var(--shadow-button);
`;

const categoryTitleStyle = css`
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-medical-text);
  margin-bottom: var(--spacing-sm);
`;

const categoryDescriptionStyle = css`
  font-size: var(--font-size-sm);
  color: var(--color-medical-text-light);
`;

const clinicsGridStyle = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-xl);
`;

const statsStyle = css`
  background: var(--color-primary);
  padding: var(--spacing-4xl) 0;
  color: var(--color-white);
`;

const statsGridStyle = css`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-xl);
  text-align: center;
`;

const statNumberStyle = css`
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-white);
  margin-bottom: var(--spacing-sm);
`;

const statLabelStyle = css`
  font-size: var(--font-size-lg);
  color: rgba(255, 255, 255, 0.9);
  font-weight: var(--font-weight-medium);
`;

const treatmentSteps = [
  {
    id: 'choose',
    name: 'Choose a Category',
    description: 'Dermatology, Plastic Surgery, Skin Treatments, or Aesthetics',
    icon: <Search size={32} />,
  },
  {
    id: 'schedule',
    name: 'Pick Date & Time',
    description: 'Select the day and time that works best for you',
    icon: <Calendar size={32} />,
  },
  {
    id: 'confirm',
    name: 'Confirm Your Appointment',
    description: 'Book your consultation or treatment with a certified clinic',
    icon: <CheckCircle size={32} />,
  },
];

const categories = [
  {
    id: 'dermatology',
    name: 'Dermatology',
    description: 'Skin health and medical treatments',
    icon: '🔬',
  },
  {
    id: 'plastic-surgery',
    name: 'Plastic Surgery',
    description: 'Cosmetic and reconstructive procedures',
    icon: '✨',
  },
  {
    id: 'aesthetics',
    name: 'Aesthetics',
    description: 'Non-surgical beauty treatments',
    icon: '💫',
  },
  {
    id: 'wellness',
    name: 'Wellness',
    description: 'Holistic health and wellness',
    icon: '🌿',
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
            Your Skin. Your Confidence. Your Clinic.
          </h1>
          <p className={heroSubtitleStyle}>
            Find Trusted Dermatologists & Aesthetic Clinics Near You
          </p>
          
          <div className={searchBoxStyle}>
            <form onSubmit={handleSearch} className={searchFormStyle}>
              <Input
                placeholder="Services"
                leftIcon={<Search size={16} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
              />
              <Input
                placeholder="Location"
                leftIcon={<MapPin size={16} />}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                fullWidth
              />
              <Button
              type="submit"
              size="lg"
              style={{ backgroundColor: "var(--color-primary)" }}
        >
          Search
          </Button>
  
            </form>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className={stepsStyle}>
        <div className={containerStyle}>
          <div className={sectionHeaderStyle}>
            <h2 className={sectionTitleStyle}>How It Works</h2>
            <h3 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-medical-text)', marginBottom: 'var(--spacing-md)' }}>
              3 Steps to Your Treatment
            </h3>
          </div>
          
          <div className={stepsGridStyle}>
            {treatmentSteps.map((step) => (
              <div key={step.id} className={stepCardStyle}>
                <div className={stepIconStyle}>
                  {step.icon}
                </div>
                <h3 className={stepTitleStyle}>{step.name}</h3>
                <p className={stepDescriptionStyle}>{step.description}</p>
              </div>
            ))}
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
                variant="default"
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
              Discover top-rated medical aesthetic clinics and dermatology centers
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
              <div className={statNumberStyle}>25,000+</div>
              <div className={statLabelStyle}>Happy Patients</div>
            </div>
            <div>
              <div className={statNumberStyle}>1,200+</div>
              <div className={statLabelStyle}>Certified Clinics</div>
            </div>
            <div>
              <div className={statNumberStyle}>150+</div>
              <div className={statLabelStyle}>Medical Procedures</div>
            </div>
            <div>
              <div className={statNumberStyle}>4.9</div>
              <div className={statLabelStyle}>Patient Satisfaction</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
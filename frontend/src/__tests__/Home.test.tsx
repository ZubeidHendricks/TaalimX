import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

describe('Home', () => {
  it('renders the heading', () => {
    render(<Home />);
    
    const heading = screen.getByText(/Quality Islamic Education/i);
    expect(heading).toBeInTheDocument();
  });

  it('renders the get started buttons', () => {
    render(<Home />);
    
    const findTeacherButton = screen.getByText(/Find a Teacher/i);
    const becomeTeacherButton = screen.getByText(/Become a Teacher/i);
    
    expect(findTeacherButton).toBeInTheDocument();
    expect(becomeTeacherButton).toBeInTheDocument();
  });

  it('renders the features section', () => {
    render(<Home />);
    
    const verifiedTeachers = screen.getByText(/Verified Teachers/i);
    const personalizedLearning = screen.getByText(/Personalized Learning/i);
    const comprehensiveCurriculum = screen.getByText(/Comprehensive Curriculum/i);
    const easyPayments = screen.getByText(/Easy Payments/i);
    
    expect(verifiedTeachers).toBeInTheDocument();
    expect(personalizedLearning).toBeInTheDocument();
    expect(comprehensiveCurriculum).toBeInTheDocument();
    expect(easyPayments).toBeInTheDocument();
  });
});

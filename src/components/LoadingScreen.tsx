import React from 'react';

interface Props {
  exiting: boolean;
}

const LoadingScreen: React.FC<Props> = ({ exiting }) => {
  return (
    <div className={`ls-screen${exiting ? ' ls-exiting' : ''}`}>
      <div className="ls-logo">
        <img src="/Archivologo.svg" alt="archiv*o" className="ls-logo-img" />
      </div>
      <div className="ls-stack">
        <img src="/onboarding-illustration.png" alt="" className="ls-illustration" draggable={false} />
      </div>
      <p className="ls-tagline">영감을 모아보세요</p>
    </div>
  );
};

export default LoadingScreen;

import React, { useState, useEffect } from 'react';

const initialSalons = [
  { id: 1, name: 'Coiffure Élégance', city: 'Paris', email: 'elegance@salon.fr', password: 'pass123', address: '123 Rue de la Paix', phone: '01 23 45 67 89', description: 'Salon haut de gamme', rating: 4.8, reviews: 24, services: [{ id: 1, name: 'Coupe femme', duration: 45, price: 50, image: '✂️' }], staff: [{ id: 1, name: 'Sophie', speciality: 'Coloration', rating: 4.9 }], photos: [], bookings: [], status: 'approved' },
  { id: 2, name: 'Salon du Marais', city: 'Paris', email: 'marais@salon.fr', password: 'pass123', address: '45 Rue des Archives', phone: '01 42 12 34 56', description: 'Tendance et moderne', rating: 4.6, reviews: 18, services: [{ id: 1, name: 'Coupe homme', duration: 30, price: 35, image: '💈' }], staff: [{ id: 1, name: 'Marc', speciality: 'Barbe', rating: 4.7 }], photos: [], bookings: [], status: 'approved' },
  { id: 3, name: 'Hair Studio Lyon', city: 'Lyon', email: 'lyon@salon.fr', password: 'pass123', address: '78 Rue Herriot', phone: '04 72 34 56 78', description: 'Spécialiste couleur', rating: 4.9, reviews: 32, services: [{ id: 1, name: 'Coloration', duration: 120, price: 75, image: '🎨' }], staff: [{ id: 1, name: 'Isabelle', speciality: 'Couleur', rating: 4.95 }], photos: [], bookings: [], status: 'approved' }
];

export default function App() {
  // ============ TOUS LES STATES EN HAUT ============
  const [view, setView] = useState('home');
  const [currentUser, setCurrentUser] = useState(null);
  const [city, setCity] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [newService, setNewService] = useState({ name: '', duration: '', price: '', image: '✂️' });
  const [newStaff, setNewStaff] = useState({ name: '', speciality: '' });
  const [photoUrl, setPhotoUrl] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('10:00');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [dashTab, setDashTab] = useState('services');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCity, setRegCity] = useState('');

  const [salons, setSalons] = useState(() => {
    const saved = localStorage.getItem('rendez_salons_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return initialSalons;
      }
    }
    return initialSalons;
  });

  useEffect(() => {
    localStorage.setItem('rendez_salons_v2', JSON.stringify(salons));
  }, [salons]);

  const colors = {
    primary: '#8B6F47',
    secondary: '#D4C4B0',
    light: '#F5F1ED',
    dark: '#3E3B38',
    accent: '#C9A961',
  };

  const buttonStyle = {
    padding: '10px 20px',
    background: colors.primary,
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px'
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    border: `2px solid ${colors.secondary}`,
    borderRadius: '6px',
    marginBottom: '10px',
    fontFamily: 'inherit',
    fontSize: '14px'
  };

  // ============ TOP RIGHT MENU ============
  const TopMenu = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: colors.primary, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h1 style={{ color: 'white', margin: 0, cursor: 'pointer', fontSize: '28px' }} onClick={() => { setView('home'); setCity(''); }}>✨ Rendez Vous</h1>
      <div style={{ display: 'flex', gap: '10px' }}>
        {currentUser ? (
          <>
            <span style={{ color: 'white', fontWeight: 'bold' }}>👋 {currentUser.name}</span>
            <button onClick={() => { setCurrentUser(null); setView('home'); setCity(''); }} style={{ background: colors.accent, color: colors.dark, border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Déconnexion</button>
          </>
        ) : (
          <>
            <button onClick={() => setView('prestataire-login')} style={{ background: 'transparent', color: 'white', border: '2px solid white', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>💇 Prestataire</button>
            <button onClick={() => setView('admin-login')} style={{ background: colors.accent, color: colors.dark, border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>⚙️ Admin</button>
          </>
        )}
      </div>
    </div>
  );

  // ============ HOME ============
  if (view === 'home') {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', background: `linear-gradient(135deg, ${colors.secondary} 0%, ${colors.light} 100%)`, minHeight: '100vh' }}>
        <TopMenu />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)' }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '56px', color: colors.primary, marginBottom: '40px' }}>✨ Rendez Vous</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', maxWidth: '700px' }}>
              <button onClick={() => setView('client')} style={{ ...buttonStyle, background: colors.primary, padding: '20px' }}>👤 Je suis CLIENT</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ CLIENT SEARCH ============
  if (view === 'client') {
    const filtered = salons.filter(s => {
      const matchCity = s.city.toLowerCase().includes(city.toLowerCase());
      const matchName = s.name.toLowerCase().includes(city.toLowerCase());
      return (matchCity || matchName) && s.status === 'approved';
    });

    return (
      <div style={{ fontFamily: 'Arial, sans-serif', background: colors.light, minHeight: '100vh' }}>
        <TopMenu />
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
          <h2 style={{ color: colors.primary, marginBottom: '20px' }}>Chercher un prestataire</h2>
          
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '30px', display: 'flex', gap: '10px' }}>
            <input type="text" placeholder="Ville ou nom du prestataire..." value={city} onChange={(e) => setCity(e.target.value)} style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
            <button style={{ ...buttonStyle }}>🔍 Chercher</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {filtered.map(s => (
              <div key={s.id} style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <h3 style={{ color: colors.primary, marginBottom: '10px' }}>{s.name}</h3>
                <p style={{ color: colors.dark, marginBottom: '5px' }}>📍 {s.city}</p>
                <p style={{ color: colors.dark, marginBottom: '5px' }}>⭐ {s.rating} ({s.reviews} avis)</p>
                <p style={{ fontSize: '12px', color: colors.dark, marginTop: '10px' }}>{s.description}</p>
                <button onClick={() => setView(`salon-detail-${s.id}`)} style={{ ...buttonStyle, width: '100%', marginTop: '15px' }}>Voir le prestataire</button>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: colors.dark }}>
              <p style={{ fontSize: '18px' }}>Aucun prestataire trouvé</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============ SALON DETAIL ============
  if (view.startsWith('salon-detail-')) {
    const salonId = parseInt(view.split('-')[2]);
    const salon = salons.find(s => s.id === salonId);

    return (
      <div style={{ fontFamily: 'Arial, sans-serif', background: colors.light, minHeight: '100vh' }}>
        <TopMenu />
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '30px', marginBottom: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: colors.primary, marginBottom: '15px' }}>{salon.name}</h2>
            <p style={{ color: colors.dark, marginBottom: '5px' }}>📍 {salon.address}</p>
            <p style={{ color: colors.dark, marginBottom: '5px' }}>📞 {salon.phone}</p>
            <p style={{ color: colors.dark, marginBottom: '15px' }}>⭐ {salon.rating}/5 ({salon.reviews} avis)</p>
            <p style={{ color: colors.dark, fontSize: '14px', lineHeight: '1.6' }}>{salon.description}</p>
          </div>

          <div style={{ background: 'white', borderRadius: '8px', padding: '30px', marginBottom: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ color: colors.primary, marginBottom: '20px' }}>Services disponibles</h3>
            <div style={{ display: 'grid', gap: '15px' }}>
              {salon.services.map(service => (
                <div key={service.id} style={{ border: `2px solid ${colors.secondary}`, borderRadius: '6px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ color: colors.primary, fontWeight: 'bold', margin: 0 }}>{service.image} {service.name}</p>
                    <p style={{ color: colors.dark, fontSize: '12px', margin: '5px 0 0 0' }}>{service.duration}min - {service.price}€</p>
                  </div>
                  <button onClick={() => { setSelectedService(service); setView(`booking-${salonId}`); }} style={{ ...buttonStyle }}>Réserver</button>
                </div>
              ))}
            </div>
          </div>

          {salon.photos.length > 0 && (
            <div style={{ background: 'white', borderRadius: '8px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h3 style={{ color: colors.primary, marginBottom: '20px' }}>Portfolio</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
                {salon.photos.map((photo, idx) => (
                  <div key={idx} style={{ background: colors.secondary, borderRadius: '6px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.dark, fontSize: '60px' }}>
                    {photo}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============ BOOKING ============
  if (view.startsWith('booking-')) {
    const salonId = parseInt(view.split('-')[1]);
    const salon = salons.find(s => s.id === salonId);

    return (
      <div style={{ fontFamily: 'Arial, sans-serif', background: colors.light, minHeight: '100vh' }}>
        <TopMenu />
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: colors.primary, marginBottom: '20px' }}>Réserver chez {salon.name}</h2>
            <p style={{ color: colors.dark, marginBottom: '20px' }}>Service: <strong>{selectedService?.name}</strong> ({selectedService?.price}€)</p>

            <input type="text" placeholder="Votre nom" value={clientName} onChange={(e) => setClientName(e.target.value)} style={inputStyle} />
            <input type="tel" placeholder="Votre téléphone" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} style={inputStyle} />
            <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} style={inputStyle} />
            <input type="time" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} style={inputStyle} />

            <button onClick={() => {
              if (clientName && clientPhone && bookingDate) {
                const newBooking = { id: Date.now(), clientName, clientPhone, service: selectedService.name, date: bookingDate, time: bookingTime, status: 'pending' };
                setSalons(salons.map(s => s.id === salonId ? { ...s, bookings: [...s.bookings, newBooking] } : s));
                alert('✅ Réservation enregistrée!');
                setView('client');
                setCity('');
              } else {
                alert('Remplissez tous les champs!');
              }
            }} style={{ ...buttonStyle, width: '100%', marginTop: '20px' }}>Confirmer</button>
          </div>
        </div>
      </div>
    );
  }

  // ============ PRESTATAIRE LOGIN ============
  if (view === 'prestataire-login') {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', background: colors.light, minHeight: '100vh' }}>
        <TopMenu />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)' }}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '40px', maxWidth: '400px', width: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <h2 style={{ color: colors.primary, marginBottom: '30px', textAlign: 'center' }}>Connexion Prestataire</h2>

            <input type="email" placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} style={inputStyle} />
            <input type="password" placeholder="Mot de passe" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} style={inputStyle} />

            <button onClick={() => {
              const salon = salons.find(s => s.email === loginEmail && s.password === loginPassword);
              if (salon) {
                setCurrentUser(salon);
                setView(`prestataire-dashboard-${salon.id}`);
                setLoginEmail('');
                setLoginPassword('');
              } else {
                alert('Email ou mot de passe incorrect');
              }
            }} style={{ ...buttonStyle, width: '100%', marginTop: '20px' }}>Se connecter</button>

            <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '20px', borderTop: `2px solid ${colors.secondary}` }}>
              <p style={{ color: colors.dark, marginBottom: '10px' }}>Pas de compte?</p>
              <button onClick={() => setView('prestataire-register')} style={{ ...buttonStyle, width: '100%', background: colors.accent }}>Créer un compte</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ PRESTATAIRE REGISTER ============
  if (view === 'prestataire-register') {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', background: colors.light, minHeight: '100vh' }}>
        <TopMenu />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)' }}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '40px', maxWidth: '400px', width: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <h2 style={{ color: colors.primary, marginBottom: '30px', textAlign: 'center' }}>Créer un compte</h2>

            <input type="text" placeholder="Nom du salon" value={regName} onChange={(e) => setRegName(e.target.value)} style={inputStyle} />
            <input type="email" placeholder="Email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} style={inputStyle} />
            <input type="password" placeholder="Mot de passe" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} style={inputStyle} />
            <input type="text" placeholder="Ville" value={regCity} onChange={(e) => setRegCity(e.target.value)} style={inputStyle} />

            <button onClick={() => {
              if (regName && regEmail && regPassword && regCity) {
                const newId = Math.max(...salons.map(s => s.id), 0) + 1;
                const newSalon = {
                  id: newId,
                  name: regName,
                  email: regEmail,
                  password: regPassword,
                  city: regCity,
                  address: '',
                  phone: '',
                  description: '',
                  rating: 4.5,
                  reviews: 0,
                  services: [],
                  staff: [],
                  photos: [],
                  bookings: [],
                  status: 'pending'
                };
                setSalons([...salons, newSalon]);
                alert('✅ Compte créé! Veuillez vous connecter.');
                setView('prestataire-login');
              } else {
                alert('Remplissez tous les champs!');
              }
            }} style={{ ...buttonStyle, width: '100%', marginTop: '20px', background: colors.accent }}>Créer</button>
          </div>
        </div>
      </div>
    );
  }

  // ============ PRESTATAIRE DASHBOARD ============
  if (view.startsWith('prestataire-dashboard-')) {
    const salonId = parseInt(view.split('-')[2]);
    const salon = salons.find(s => s.id === salonId);

    if (!salon) return <div>Erreur</div>;

    return (
      <div style={{ fontFamily: 'Arial, sans-serif', background: colors.light, minHeight: '100vh' }}>
        <TopMenu />
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
          <h1 style={{ color: colors.primary }}>Dashboard - {salon.name}</h1>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
            {['services', 'staff', 'photos', 'reservations', 'profil'].map(tab => (
              <button key={tab} onClick={() => setDashTab(tab)} style={{ ...buttonStyle, background: dashTab === tab ? colors.primary : colors.secondary, color: dashTab === tab ? 'white' : colors.dark }}>
                {tab === 'services' && '💇 Services'}
                {tab === 'staff' && '👥 Équipe'}
                {tab === 'photos' && '🖼️ Photos'}
                {tab === 'reservations' && '📅 Réservations'}
                {tab === 'profil' && '📋 Profil'}
              </button>
            ))}
          </div>

          {/* SERVICES */}
          {dashTab === 'services' && (
            <div style={{ background: 'white', borderRadius: '8px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h3 style={{ color: colors.primary, marginBottom: '20px' }}>Mes prestations</h3>

              <div style={{ marginBottom: '30px', paddingBottom: '30px', borderBottom: `2px solid ${colors.secondary}` }}>
                <h4 style={{ color: colors.dark, marginBottom: '15px' }}>Ajouter une prestation</h4>
                <input type="text" placeholder="Nom (ex: Coupe femme)" value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} style={inputStyle} />
                <input type="number" placeholder="Durée (min)" value={newService.duration} onChange={(e) => setNewService({ ...newService, duration: e.target.value })} style={inputStyle} />
                <input type="number" placeholder="Prix (€)" value={newService.price} onChange={(e) => setNewService({ ...newService, price: e.target.value })} style={inputStyle} />
                <input type="text" placeholder="Emoji (ex: ✂️)" value={newService.image} onChange={(e) => setNewService({ ...newService, image: e.target.value })} style={inputStyle} />
                <button onClick={() => {
                  if (newService.name && newService.duration && newService.price) {
                    setSalons(salons.map(s => s.id === salonId ? {
                      ...s,
                      services: [...s.services, { id: Date.now(), ...newService }]
                    } : s));
                    setNewService({ name: '', duration: '', price: '', image: '✂️' });
                    alert('✅ Prestation ajoutée!');
                  }
                }} style={{ ...buttonStyle, width: '100%' }}>Ajouter</button>
              </div>

              <div>
                <h4 style={{ color: colors.dark, marginBottom: '15px' }}>Vos prestations</h4>
                {salon.services.map(service => (
                  <div key={service.id} style={{ background: colors.light, border: `2px solid ${colors.secondary}`, borderRadius: '6px', padding: '15px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ color: colors.primary, fontWeight: 'bold', margin: 0 }}>{service.image} {service.name}</p>
                      <p style={{ color: colors.dark, fontSize: '12px', margin: '5px 0 0 0' }}>{service.duration}min - {service.price}€</p>
                    </div>
                    <button onClick={() => {
                      setSalons(salons.map(s => s.id === salonId ? {
                        ...s,
                        services: s.services.filter(srv => srv.id !== service.id)
                      } : s));
                    }} style={{ ...buttonStyle, background: '#E74C3C' }}>Supprimer</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STAFF */}
          {dashTab === 'staff' && (
            <div style={{ background: 'white', borderRadius: '8px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h3 style={{ color: colors.primary, marginBottom: '20px' }}>Mon équipe</h3>

              <div style={{ marginBottom: '30px', paddingBottom: '30px', borderBottom: `2px solid ${colors.secondary}` }}>
                <input type="text" placeholder="Nom" value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} style={inputStyle} />
                <input type="text" placeholder="Spécialité" value={newStaff.speciality} onChange={(e) => setNewStaff({ ...newStaff, speciality: e.target.value })} style={inputStyle} />
                <button onClick={() => {
                  if (newStaff.name && newStaff.speciality) {
                    setSalons(salons.map(s => s.id === salonId ? {
                      ...s,
                      staff: [...s.staff, { id: Date.now(), ...newStaff, rating: 4.5 }]
                    } : s));
                    setNewStaff({ name: '', speciality: '' });
                    alert('✅ Membre ajouté!');
                  }
                }} style={{ ...buttonStyle, width: '100%' }}>Ajouter</button>
              </div>

              <div>
                {salon.staff.map(member => (
                  <div key={member.id} style={{ background: colors.light, border: `2px solid ${colors.secondary}`, borderRadius: '6px', padding: '15px', marginBottom: '10px' }}>
                    <p style={{ color: colors.primary, fontWeight: 'bold', margin: 0 }}>👤 {member.name}</p>
                    <p style={{ color: colors.dark, fontSize: '12px', margin: '5px 0 0 0' }}>{member.speciality}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PHOTOS */}
          {dashTab === 'photos' && (
            <div style={{ background: 'white', borderRadius: '8px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h3 style={{ color: colors.primary, marginBottom: '20px' }}>Portfolio</h3>

              <div style={{ marginBottom: '30px', paddingBottom: '30px', borderBottom: `2px solid ${colors.secondary}` }}>
                <p style={{ fontSize: '12px', color: colors.dark, marginBottom: '10px' }}>Tapez un emoji (ex: 💇 💅 ✨)</p>
                <input type="text" placeholder="Photo (emoji)" maxLength="2" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} style={inputStyle} />
                <button onClick={() => {
                  if (photoUrl) {
                    setSalons(salons.map(s => s.id === salonId ? {
                      ...s,
                      photos: [...s.photos, photoUrl]
                    } : s));
                    setPhotoUrl('');
                    alert('✅ Photo ajoutée!');
                  }
                }} style={{ ...buttonStyle, width: '100%' }}>Ajouter</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '10px' }}>
                {salon.photos.map((photo, idx) => (
                  <div key={idx} style={{ background: colors.secondary, borderRadius: '6px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', cursor: 'pointer', position: 'relative' }}>
                    {photo}
                    <button onClick={() => {
                      setSalons(salons.map(s => s.id === salonId ? {
                        ...s,
                        photos: s.photos.filter((_, i) => i !== idx)
                      } : s));
                    }} style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#E74C3C', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', padding: 0 }}>×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RESERVATIONS */}
          {dashTab === 'reservations' && (
            <div style={{ background: 'white', borderRadius: '8px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h3 style={{ color: colors.primary, marginBottom: '20px' }}>Réservations</h3>

              {salon.bookings.length === 0 ? (
                <p style={{ color: colors.dark, textAlign: 'center', padding: '40px' }}>Aucune réservation</p>
              ) : (
                salon.bookings.map(booking => (
                  <div key={booking.id} style={{ background: colors.light, border: `2px solid ${colors.secondary}`, borderRadius: '6px', padding: '15px', marginBottom: '10px' }}>
                    <p style={{ color: colors.primary, fontWeight: 'bold', margin: '0 0 5px 0' }}>📅 {booking.date} à {booking.time}</p>
                    <p style={{ color: colors.dark, fontSize: '12px', margin: '5px 0' }}>Service: {booking.service}</p>
                    <p style={{ color: colors.dark, fontSize: '12px', margin: '5px 0' }}>Client: {booking.clientName} ({booking.clientPhone})</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* PROFIL */}
          {dashTab === 'profil' && (
            <div style={{ background: 'white', borderRadius: '8px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h3 style={{ color: colors.primary, marginBottom: '20px' }}>Profil</h3>
              <p><strong>Nom:</strong> {salon.name}</p>
              <p><strong>Email:</strong> {salon.email}</p>
              <p><strong>Ville:</strong> {salon.city}</p>
              <p style={{ fontSize: '12px', color: '#27AE60', marginTop: '30px' }}>✅ Statut: {salon.status === 'approved' ? 'Approuvé' : 'En attente'}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============ ADMIN LOGIN ============
  if (view === 'admin-login') {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', background: colors.light, minHeight: '100vh' }}>
        <TopMenu />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)' }}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '40px', maxWidth: '400px', width: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <h2 style={{ color: colors.primary, marginBottom: '30px', textAlign: 'center' }}>Admin</h2>

            <input type="password" placeholder="Mot de passe" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} style={inputStyle} />

            <button onClick={() => {
              if (adminPass === 'admin123') {
                setView('admin-dashboard');
                setAdminPass('');
              } else {
                alert('Incorrect');
              }
            }} style={{ ...buttonStyle, width: '100%', marginTop: '20px' }}>Se connecter</button>
          </div>
        </div>
      </div>
    );
  }

  // ============ ADMIN DASHBOARD ============
  if (view === 'admin-dashboard') {
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', background: colors.light, minHeight: '100vh' }}>
        <TopMenu />
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
          <h1 style={{ color: colors.primary }}>Admin Panel</h1>

          <div style={{ background: 'white', borderRadius: '8px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h3 style={{ color: colors.primary, marginBottom: '20px' }}>Prestataires ({salons.length})</h3>

            {salons.map(s => (
              <div key={s.id} style={{ background: colors.light, border: `2px solid ${colors.secondary}`, borderRadius: '6px', padding: '15px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: colors.primary, fontWeight: 'bold', margin: 0 }}>{s.name}</p>
                  <p style={{ color: colors.dark, fontSize: '12px', margin: '5px 0 0 0' }}>{s.city} | {s.email}</p>
                </div>
                {s.status === 'pending' && (
                  <button onClick={() => {
                    setSalons(salons.map(x => x.id === s.id ? { ...x, status: 'approved' } : x));
                  }} style={{ ...buttonStyle, background: '#27AE60' }}>Approuver</button>
                )}
                {s.status === 'approved' && (
                  <span style={{ color: '#27AE60', fontWeight: 'bold' }}>✅ Approuvé</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <div>Erreur 404</div>;
}
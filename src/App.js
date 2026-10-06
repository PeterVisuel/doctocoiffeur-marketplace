import React, { useState, useEffect } from 'react';

export default function RendezVousApp() {
  // ===== TOUS LES HOOKS EN HAUT =====
  const [view, setView] = useState('home');
  const [user, setUser] = useState(null);
  const [prestataires, setPrestataires] = useState(() => {
    const saved = localStorage.getItem('rendez_prestataires_v3');
    return saved ? JSON.parse(saved) : getDefaultPrestataires();
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchName, setSearchName] = useState('');
  const [selectedPrestataire, setSelectedPrestataire] = useState(null);
  const [reservationDate, setReservationDate] = useState('');
  const [reservationTime, setReservationTime] = useState('');
  const [reservationName, setReservationName] = useState('');
  const [reservationPhone, setReservationPhone] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [showPayment, setShowPayment] = useState(false);

  // Prestataire dashboard
  const [newService, setNewService] = useState({ name: '', price: '' });
  const [newPhotos, setNewPhotos] = useState([]);
  const [adminFilter, setAdminFilter] = useState('pending');
  const [currentTab, setCurrentTab] = useState('services');

  // ===== SAUVEGARDER PRESTATAIRES =====
  useEffect(() => {
    localStorage.setItem('rendez_prestataires_v3', JSON.stringify(prestataires));
  }, [prestataires]);

  // ===== DONNÉES PAR DÉFAUT =====
  function getDefaultPrestataires() {
    return [
      {
        id: 1,
        name: 'Elegance Paris',
        city: 'Paris',
        email: 'elegance@salon.fr',
        password: 'pass123',
        approved: true,
        services: [
          { id: 1, name: 'Coupe Femme', price: 45 },
          { id: 2, name: 'Coloration', price: 60 },
        ],
        photos: [],
        reservations: [],
        team: [],
      },
      {
        id: 2,
        name: 'Le Marais',
        city: 'Paris',
        email: 'marais@salon.fr',
        password: 'pass123',
        approved: true,
        services: [
          { id: 1, name: 'Coupe Homme', price: 25 },
          { id: 2, name: 'Barbe', price: 20 },
        ],
        photos: [],
        reservations: [],
        team: [],
      },
      {
        id: 3,
        name: 'Style Lyon',
        city: 'Lyon',
        email: 'lyon@salon.fr',
        password: 'pass123',
        approved: true,
        services: [
          { id: 1, name: 'Coupe Enfant', price: 30 },
          { id: 2, name: 'Lissage', price: 80 },
        ],
        photos: [],
        reservations: [],
        team: [],
      },
    ];
  }

  // ===== FONCTIONS UTILITAIRES =====
  const handleLogin = () => {
    if (loginEmail === 'admin123' && loginPassword === 'admin123') {
      setUser({ type: 'admin' });
      setView('admin');
      return;
    }

    const prestataire = prestataires.find(
      p => p.email === loginEmail && p.password === loginPassword
    );

    if (prestataire) {
      setUser({ type: 'prestataire', id: prestataire.id });
      setView('prestataire-dashboard');
    } else {
      alert('Email ou password incorrect');
    }

    setLoginEmail('');
    setLoginPassword('');
  };

  const handleLogout = () => {
    setUser(null);
    setView('home');
    setSelectedPrestataire(null);
  };

  const handleSearch = () => {
    setSelectedPrestataire(null);
    setView('search-results');
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewPhotos([...newPhotos, {
          id: Date.now() + Math.random(),
          data: event.target.result,
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddPhotos = () => {
    if (newPhotos.length === 0) return;

    const updatedPrestataires = prestataires.map(p => {
      if (p.id === user.id) {
        return {
          ...p,
          photos: [...(p.photos || []), ...newPhotos],
        };
      }
      return p;
    });

    setPrestataires(updatedPrestataires);
    setNewPhotos([]);
  };

  const handleDeletePhoto = (photoId) => {
    const updatedPrestataires = prestataires.map(p => {
      if (p.id === user.id) {
        return {
          ...p,
          photos: p.photos.filter(ph => ph.id !== photoId),
        };
      }
      return p;
    });
    setPrestataires(updatedPrestataires);
  };

  const handleAddService = () => {
    if (!newService.name || !newService.price) return;

    const updatedPrestataires = prestataires.map(p => {
      if (p.id === user.id) {
        return {
          ...p,
          services: [...p.services, {
            id: Date.now(),
            name: newService.name,
            price: parseFloat(newService.price),
          }],
        };
      }
      return p;
    });

    setPrestataires(updatedPrestataires);
    setNewService({ name: '', price: '' });
  };

  const handleApprovePrestataire = (id) => {
    const updatedPrestataires = prestataires.map(p => {
      if (p.id === id) {
        return { ...p, approved: true };
      }
      return p;
    });
    setPrestataires(updatedPrestataires);
  };

  const handleRejectPrestataire = (id) => {
    setPrestataires(prestataires.filter(p => p.id !== id));
  };

  const handleBookService = () => {
    if (!reservationDate || !reservationTime || !reservationName || !reservationPhone || !selectedService) {
      alert('Remplissez tous les champs');
      return;
    }

    const updatedPrestataires = prestataires.map(p => {
      if (p.id === selectedPrestataire.id) {
        return {
          ...p,
          reservations: [...p.reservations, {
            id: Date.now(),
            date: reservationDate,
            time: reservationTime,
            clientName: reservationName,
            clientPhone: reservationPhone,
            service: selectedService.name,
            price: selectedService.price,
            status: 'pending',
          }],
        };
      }
      return p;
    });

    setPrestataires(updatedPrestataires);
    setShowPayment(true);
  };

  // ===== STYLES =====
  const styles = {
    container: {
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#ffffff',
      color: '#000000',
      minHeight: '100vh',
      padding: '0',
    },
    header: {
      backgroundColor: '#000000',
      color: '#ffffff',
      padding: '15px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    },
    logo: {
      fontSize: '24px',
      fontWeight: 'bold',
      cursor: 'pointer',
    },
    menuRight: {
      display: 'flex',
      gap: '15px',
      alignItems: 'center',
    },
    btn: {
      padding: '10px 20px',
      borderRadius: '4px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 'bold',
      transition: 'all 0.3s',
    },
    btnPrimary: {
      backgroundColor: '#000000',
      color: '#ffffff',
      border: '1px solid #ffffff',
    },
    btnSecondary: {
      backgroundColor: '#ffffff',
      color: '#000000',
      border: '1px solid #000000',
    },
    input: {
      padding: '10px',
      border: '1px solid #000000',
      borderRadius: '4px',
      fontSize: '14px',
      marginBottom: '10px',
      width: '100%',
      boxSizing: 'border-box',
    },
    card: {
      backgroundColor: '#f9f9f9',
      border: '1px solid #000000',
      borderRadius: '4px',
      padding: '15px',
      marginBottom: '15px',
      cursor: 'pointer',
      transition: 'all 0.3s',
    },
    cardHover: {
      backgroundColor: '#f0f0f0',
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '20px',
    },
    th: {
      backgroundColor: '#000000',
      color: '#ffffff',
      padding: '10px',
      textAlign: 'left',
      borderRadius: '4px',
    },
    td: {
      padding: '10px',
      borderBottom: '1px solid #cccccc',
    },
    tab: {
      padding: '10px 20px',
      backgroundColor: '#f0f0f0',
      border: '1px solid #000000',
      borderRadius: '4px',
      cursor: 'pointer',
      marginRight: '5px',
      fontSize: '14px',
      fontWeight: 'bold',
    },
    tabActive: {
      backgroundColor: '#000000',
      color: '#ffffff',
    },
  };

  // ===== RENDER PAGES =====

  // PAGE ACCUEIL
  if (view === 'home') {
    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.logo}>Rendez Vous</div>
          <div style={styles.menuRight}>
            <button
              style={{ ...styles.btn, ...styles.btnPrimary }}
              onClick={() => setView('login')}
            >
              Connexion
            </button>
          </div>
        </header>

        <div style={styles.content}>
          <div style={{ textAlign: 'center', marginTop: '50px', marginBottom: '50px' }}>
            <h1>Rendez Vous</h1>
            <p style={{ fontSize: '18px', color: '#666' }}>Trouvez et réservez vos prestataires</p>
          </div>

          <div style={{
            backgroundColor: '#f9f9f9',
            padding: '30px',
            borderRadius: '4px',
            border: '1px solid #000000',
            maxWidth: '600px',
            margin: '0 auto',
          }}>
            <h2>Rechercher un prestataire</h2>
            <input
              type="text"
              placeholder="Ville"
              style={styles.input}
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
            />
            <input
              type="text"
              placeholder="Nom du prestataire"
              style={styles.input}
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
            <button
              style={{ ...styles.btn, ...styles.btnPrimary, width: '100%' }}
              onClick={handleSearch}
            >
              Rechercher
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PAGE LOGIN
  if (view === 'login') {
    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.logo} onClick={() => setView('home')}>Rendez Vous</div>
          <div style={styles.menuRight}>
            <button
              style={{ ...styles.btn, ...styles.btnSecondary }}
              onClick={() => setView('home')}
            >
              Accueil
            </button>
          </div>
        </header>

        <div style={styles.content}>
          <div style={{
            backgroundColor: '#f9f9f9',
            padding: '30px',
            borderRadius: '4px',
            border: '1px solid #000000',
            maxWidth: '400px',
            margin: '50px auto',
          }}>
            <h2>Connexion</h2>
            <input
              type="email"
              placeholder="Email"
              style={styles.input}
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              style={styles.input}
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
            />
            <button
              style={{ ...styles.btn, ...styles.btnPrimary, width: '100%' }}
              onClick={handleLogin}
            >
              Se connecter
            </button>

            <p style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
              Comptes de test:
              <br />
              elegance@salon.fr / pass123
              <br />
              marais@salon.fr / pass123
              <br />
              lyon@salon.fr / pass123
              <br />
              admin123 / admin123
            </p>
          </div>
        </div>
      </div>
    );
  }

  // PAGE RÉSULTATS RECHERCHE
  if (view === 'search-results') {
    const filtered = prestataires.filter(p => {
      const matchCity = !searchCity || p.city.toLowerCase().includes(searchCity.toLowerCase());
      const matchName = !searchName || p.name.toLowerCase().includes(searchName.toLowerCase());
      return matchCity && matchName && p.approved;
    });

    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.logo} onClick={() => setView('home')}>Rendez Vous</div>
          <div style={styles.menuRight}>
            <button
              style={{ ...styles.btn, ...styles.btnSecondary }}
              onClick={() => setView('home')}
            >
              Retour
            </button>
          </div>
        </header>

        <div style={styles.content}>
          <h2>Résultats ({filtered.length})</h2>
          {filtered.length === 0 ? (
            <p>Aucun prestataire trouvé</p>
          ) : (
            filtered.map(p => (
              <div
                key={p.id}
                style={styles.card}
                onClick={() => {
                  setSelectedPrestataire(p);
                  setView('prestataire-detail');
                }}
              >
                <h3>{p.name}</h3>
                <p>{p.city}</p>
                <p>{p.services.length} services</p>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // PAGE DÉTAIL PRESTATAIRE
  if (view === 'prestataire-detail') {
    if (!selectedPrestataire) return null;

    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.logo} onClick={() => setView('home')}>Rendez Vous</div>
          <div style={styles.menuRight}>
            <button
              style={{ ...styles.btn, ...styles.btnSecondary }}
              onClick={() => {
                setView('search-results');
                setSelectedPrestataire(null);
              }}
            >
              Retour
            </button>
          </div>
        </header>

        <div style={styles.content}>
          <h2>{selectedPrestataire.name}</h2>
          <p>{selectedPrestataire.city}</p>

          {/* PHOTOS */}
          <div style={{ marginTop: '30px', marginBottom: '30px' }}>
            <h3>Photos</h3>
            {selectedPrestataire.photos && selectedPrestataire.photos.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                {selectedPrestataire.photos.map(photo => (
                  <div key={photo.id} style={{ width: '100%', height: '200px', overflow: 'hidden', borderRadius: '4px', border: '1px solid #000' }}>
                    <img src={photo.data} alt="photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            ) : (
              <p>Pas de photos</p>
            )}
          </div>

          {/* SERVICES */}
          <div style={{ marginTop: '30px' }}>
            <h3>Services</h3>
            {selectedPrestataire.services.map(service => (
              <div key={service.id} style={{ ...styles.card, cursor: 'pointer', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{service.name}</span>
                  <span>{service.price} EUR</span>
                </div>
                <button
                  style={{ ...styles.btn, ...styles.btnPrimary, marginTop: '10px', width: '100%' }}
                  onClick={() => {
                    setSelectedService(service);
                    setView('reservation');
                  }}
                >
                  Réserver
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // PAGE RÉSERVATION
  if (view === 'reservation') {
    if (!selectedPrestataire || !selectedService) return null;

    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.logo} onClick={() => setView('home')}>Rendez Vous</div>
          <div style={styles.menuRight}>
            <button
              style={{ ...styles.btn, ...styles.btnSecondary }}
              onClick={() => {
                setView('prestataire-detail');
                setSelectedService(null);
              }}
            >
              Retour
            </button>
          </div>
        </header>

        <div style={styles.content}>
          <div style={{
            backgroundColor: '#f9f9f9',
            padding: '30px',
            borderRadius: '4px',
            border: '1px solid #000000',
            maxWidth: '500px',
            margin: '30px auto',
          }}>
            <h2>{selectedPrestataire.name}</h2>
            <p>{selectedService.name} - {selectedService.price} EUR</p>

            {!showPayment ? (
              <>
                <input
                  type="date"
                  style={styles.input}
                  value={reservationDate}
                  onChange={(e) => setReservationDate(e.target.value)}
                />
                <input
                  type="time"
                  style={styles.input}
                  value={reservationTime}
                  onChange={(e) => setReservationTime(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Votre nom"
                  style={styles.input}
                  value={reservationName}
                  onChange={(e) => setReservationName(e.target.value)}
                />
                <input
                  type="tel"
                  placeholder="Votre téléphone"
                  style={styles.input}
                  value={reservationPhone}
                  onChange={(e) => setReservationPhone(e.target.value)}
                />
                <button
                  style={{ ...styles.btn, ...styles.btnPrimary, width: '100%' }}
                  onClick={handleBookService}
                >
                  Confirmer et Payer
                </button>
              </>
            ) : (
              <div style={{ backgroundColor: '#ffffff', padding: '20px', border: '1px solid #000', borderRadius: '4px' }}>
                <h3>Paiement Stripe</h3>
                <p>Montant: {selectedService.price} EUR</p>
                <button
                  style={{ ...styles.btn, ...styles.btnPrimary, width: '100%', marginBottom: '10px' }}
                  onClick={() => alert('Intégration Stripe à venir. Paiement simulé.')}
                >
                  Payer maintenant
                </button>
                <button
                  style={{ ...styles.btn, ...styles.btnSecondary, width: '100%' }}
                  onClick={() => {
                    setShowPayment(false);
                    setReservationDate('');
                    setReservationTime('');
                    setReservationName('');
                    setReservationPhone('');
                    setSelectedService(null);
                    setView('home');
                  }}
                >
                  Annuler
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // DASHBOARD PRESTATAIRE
  if (view === 'prestataire-dashboard') {
    const currentPrestataire = prestataires.find(p => p.id === user.id);
    if (!currentPrestataire) return null;

    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.logo}>Rendez Vous</div>
          <div style={styles.menuRight}>
            <span>{currentPrestataire.name}</span>
            <button
              style={{ ...styles.btn, ...styles.btnSecondary }}
              onClick={handleLogout}
            >
              Déconnexion
            </button>
          </div>
        </header>

        <div style={styles.content}>
          <div style={{ display: 'flex', gap: '5px', marginBottom: '20px' }}>
            {['services', 'photos', 'reservations', 'profile'].map(tab => (
              <button
                key={tab}
                style={{
                  ...styles.tab,
                  ...(currentTab === tab ? styles.tabActive : {}),
                }}
                onClick={() => setCurrentTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* SERVICES */}
          {currentTab === 'services' && (
            <div>
              <h3>Services</h3>
              <div style={{ marginBottom: '20px' }}>
                <input
                  type="text"
                  placeholder="Nom du service"
                  style={styles.input}
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Prix (EUR)"
                  style={styles.input}
                  value={newService.price}
                  onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                />
                <button
                  style={{ ...styles.btn, ...styles.btnPrimary, width: '100%' }}
                  onClick={handleAddService}
                >
                  Ajouter
                </button>
              </div>

              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Service</th>
                    <th style={styles.th}>Prix</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPrestataire.services.map(service => (
                    <tr key={service.id}>
                      <td style={styles.td}>{service.name}</td>
                      <td style={styles.td}>{service.price} EUR</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PHOTOS */}
          {currentTab === 'photos' && (
            <div>
              <h3>Galerie Photos</h3>
              <div style={{ marginBottom: '20px' }}>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{ marginBottom: '10px' }}
                />
                {newPhotos.length > 0 && (
                  <>
                    <p>Aperçu: {newPhotos.length} image(s)</p>
                    <button
                      style={{ ...styles.btn, ...styles.btnPrimary, marginRight: '10px' }}
                      onClick={handleAddPhotos}
                    >
                      Ajouter les photos
                    </button>
                    <button
                      style={{ ...styles.btn, ...styles.btnSecondary }}
                      onClick={() => setNewPhotos([])}
                    >
                      Annuler
                    </button>
                  </>
                )}
              </div>

              {currentPrestataire.photos && currentPrestataire.photos.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
                  {currentPrestataire.photos.map(photo => (
                    <div key={photo.id} style={{ position: 'relative' }}>
                      <img src={photo.data} alt="photo" style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #000' }} />
                      <button
                        style={{
                          position: 'absolute',
                          top: '5px',
                          right: '5px',
                          backgroundColor: '#000000',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '30px',
                          height: '30px',
                          cursor: 'pointer',
                          fontSize: '16px',
                        }}
                        onClick={() => handleDeletePhoto(photo.id)}
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Aucune photo</p>
              )}
            </div>
          )}

          {/* RÉSERVATIONS */}
          {currentTab === 'reservations' && (
            <div>
              <h3>Réservations</h3>
              {currentPrestataire.reservations && currentPrestataire.reservations.length > 0 ? (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Heure</th>
                      <th style={styles.th}>Client</th>
                      <th style={styles.th}>Service</th>
                      <th style={styles.th}>Prix</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPrestataire.reservations.map(res => (
                      <tr key={res.id}>
                        <td style={styles.td}>{res.date}</td>
                        <td style={styles.td}>{res.time}</td>
                        <td style={styles.td}>{res.clientName}</td>
                        <td style={styles.td}>{res.service}</td>
                        <td style={styles.td}>{res.price} EUR</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>Aucune réservation</p>
              )}
            </div>
          )}

          {/* PROFILE */}
          {currentTab === 'profile' && (
            <div>
              <h3>Profil</h3>
              <p>Nom: {currentPrestataire.name}</p>
              <p>Ville: {currentPrestataire.city}</p>
              <p>Email: {currentPrestataire.email}</p>
              <p>Statut: {currentPrestataire.approved ? 'Approuvé' : 'En attente'}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ADMIN PANEL
  if (view === 'admin') {
    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.logo}>Rendez Vous</div>
          <div style={styles.menuRight}>
            <span>ADMIN</span>
            <button
              style={{ ...styles.btn, ...styles.btnSecondary }}
              onClick={handleLogout}
            >
              Déconnexion
            </button>
          </div>
        </header>

        <div style={styles.content}>
          <h2>Admin Panel</h2>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            {['pending', 'approved', 'all'].map(filter => (
              <button
                key={filter}
                style={{
                  ...styles.btn,
                  ...(adminFilter === filter ? styles.btnPrimary : styles.btnSecondary),
                }}
                onClick={() => setAdminFilter(filter)}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          {prestataires
            .filter(p => {
              if (adminFilter === 'pending') return !p.approved;
              if (adminFilter === 'approved') return p.approved;
              return true;
            })
            .map(p => (
              <div key={p.id} style={styles.card}>
                <h3>{p.name}</h3>
                <p>{p.city} | {p.email}</p>
                <p>Statut: {p.approved ? 'Approuvé' : 'En attente'}</p>
                {!p.approved && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      style={{ ...styles.btn, ...styles.btnPrimary }}
                      onClick={() => handleApprovePrestataire(p.id)}
                    >
                      Approuver
                    </button>
                    <button
                      style={{ ...styles.btn, ...styles.btnSecondary }}
                      onClick={() => handleRejectPrestataire(p.id)}
                    >
                      Rejeter
                    </button>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    );
  }

  return null;
}
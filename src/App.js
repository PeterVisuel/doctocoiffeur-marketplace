import React, { useState } from 'react';

const initialSalons = [
  { id: 1, name: 'Coiffure Élégance', city: 'Paris', address: '123 Rue de la Paix', phone: '01 23 45 67 89', description: 'Salon haut de gamme', rating: 4.8, reviews: 24, services: [{ id: 1, name: 'Coupe femme', duration: 45, min_price: 40, max_price: 55 }], staff: [{ id: 1, name: 'Sophie', speciality: 'Coloration', rating: 4.9, bio: '15 ans' }], status: 'approved' },
  { id: 2, name: 'Salon du Marais', city: 'Paris', address: '45 Rue des Archives', phone: '01 42 12 34 56', description: 'Tendance et moderne', rating: 4.6, reviews: 18, services: [{ id: 1, name: 'Coupe homme', duration: 30, min_price: 25, max_price: 35 }], staff: [{ id: 1, name: 'Marc', speciality: 'Barbe', rating: 4.7, bio: '10 ans' }], status: 'approved' },
  { id: 3, name: 'Hair Studio Lyon', city: 'Lyon', address: '78 Rue Édouard Herriot', phone: '04 72 34 56 78', description: 'Spécialiste couleur', rating: 4.9, reviews: 32, services: [{ id: 1, name: 'Coloration complète', duration: 120, min_price: 60, max_price: 90 }], staff: [{ id: 1, name: 'Isabelle', speciality: 'Couleur', rating: 4.95, bio: '20 ans' }], status: 'approved' },
  { id: 4, name: 'Coiffure Classique', city: 'Marseille', address: '120 La Canebière', phone: '04 91 23 45 67', description: 'Classique et élégant', rating: 4.5, reviews: 15, services: [{ id: 1, name: 'Coupe femme', duration: 45, min_price: 35, max_price: 50 }], staff: [{ id: 1, name: 'Claire', speciality: 'Coupe', rating: 4.6, bio: '8 ans' }], status: 'approved' },
  { id: 5, name: 'Salon Toulouse Pro', city: 'Toulouse', address: '56 Rue Alsace-Lorraine', phone: '05 61 12 34 56', description: 'Professionnel', rating: 4.7, reviews: 21, services: [{ id: 1, name: 'Permanente', duration: 90, min_price: 45, max_price: 65 }], staff: [{ id: 1, name: 'Nathalie', speciality: 'Permanente', rating: 4.8, bio: '12 ans' }], status: 'approved' },
  { id: 6, name: 'Hair Lounge Nice', city: 'Nice', address: '34 Promenade des Anglais', phone: '04 93 45 67 89', description: 'Luxe et détente', rating: 4.9, reviews: 28, services: [{ id: 1, name: 'Soin intensif', duration: 60, min_price: 50, max_price: 75 }], staff: [{ id: 1, name: 'Véronique', speciality: 'Soin', rating: 4.9, bio: '18 ans' }], status: 'approved' },
  { id: 7, name: 'Coupes Modernes', city: 'Bordeaux', address: '12 Rue Thiers', phone: '05 56 23 45 67', description: 'Moderne et tendance', rating: 4.6, reviews: 19, services: [{ id: 1, name: 'Dégradé progressif', duration: 50, min_price: 30, max_price: 45 }], staff: [{ id: 1, name: 'Antoine', speciality: 'Homme', rating: 4.7, bio: '6 ans' }], status: 'approved' },
  { id: 8, name: 'Salon Prestige Lille', city: 'Lille', address: '67 Rue Faidherbe', phone: '03 20 34 56 78', description: 'Prestige', rating: 4.8, reviews: 25, services: [{ id: 1, name: 'Coupe enfant', duration: 25, min_price: 15, max_price: 25 }], staff: [{ id: 1, name: 'Sylvie', speciality: 'Enfant', rating: 4.9, bio: '14 ans' }], status: 'approved' },
  { id: 9, name: 'Coif Nantes', city: 'Nantes', address: '23 Rue Crébillon', phone: '02 40 12 34 56', description: 'Cosy et chaleureux', rating: 4.4, reviews: 12, services: [{ id: 1, name: 'Mèches', duration: 75, min_price: 40, max_price: 60 }], staff: [{ id: 1, name: 'Audrey', speciality: 'Mèches', rating: 4.6, bio: '9 ans' }], status: 'approved' },
  { id: 10, name: 'Hair Expert Strasbourg', city: 'Strasbourg', address: '45 Grand Rue', phone: '03 88 45 67 89', description: 'Expert et attentif', rating: 4.7, reviews: 20, services: [{ id: 1, name: 'Traitement protéine', duration: 60, min_price: 35, max_price: 55 }], staff: [{ id: 1, name: 'Laurent', speciality: 'Traitement', rating: 4.8, bio: '11 ans' }], status: 'approved' },
  { id: 11, name: 'Salon Beaulieu', city: 'Montpellier', address: '89 Rue de la Loge', phone: '04 67 23 45 67', description: 'Beaulieu garanti', rating: 4.5, reviews: 17, services: [{ id: 1, name: 'Brushing', duration: 30, min_price: 20, max_price: 30 }], staff: [{ id: 1, name: 'Mélanie', speciality: 'Brushing', rating: 4.6, bio: '7 ans' }], status: 'approved' },
  { id: 12, name: 'Coiffure Art', city: 'Rennes', address: '12 Rue de Nemours', phone: '02 99 34 56 78', description: 'Créatif et innovant', rating: 4.6, reviews: 22, services: [{ id: 1, name: 'Coupe créative', duration: 50, min_price: 35, max_price: 50 }], staff: [{ id: 1, name: 'Pierre', speciality: 'Créatif', rating: 4.7, bio: '13 ans' }], status: 'approved' },
  { id: 13, name: 'Salon Belle Époque', city: 'Rouen', address: '56 Rue Jeanne d\'Arc', phone: '02 35 12 34 56', description: 'Retro chic', rating: 4.4, reviews: 14, services: [{ id: 1, name: 'Mise en plis', duration: 40, min_price: 25, max_price: 35 }], staff: [{ id: 1, name: 'Francine', speciality: 'Mise en plis', rating: 4.5, bio: '25 ans' }], status: 'approved' },
  { id: 14, name: 'Modern Cuts', city: 'Toulouse', address: '34 Avenue Jean Jaurès', phone: '05 62 45 67 89', description: 'Jeune et dynamique', rating: 4.7, reviews: 23, services: [{ id: 1, name: 'Undercut', duration: 35, min_price: 28, max_price: 40 }], staff: [{ id: 1, name: 'Olivier', speciality: 'Homme', rating: 4.8, bio: '5 ans' }], status: 'approved' },
  { id: 15, name: 'Salon Zen', city: 'Paris', address: '78 Boulevard Saint-Germain', phone: '01 45 67 89 01', description: 'Relaxation et beauté', rating: 4.8, reviews: 26, services: [{ id: 1, name: 'Massage cuir chevelu', duration: 45, min_price: 30, max_price: 45 }], staff: [{ id: 1, name: 'Chloé', speciality: 'Bien-être', rating: 4.9, bio: '11 ans' }], status: 'approved' }
];

export default function App() {
  const [view, setView] = useState('home');
  const [salons, setSalons] = useState(initialSalons);
  const [city, setCity] = useState('');
  const [id, setId] = useState('');
  const [newName, setNewName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [creating, setCreating] = useState(false);
  const [pass, setPass] = useState('');

  // HOME
  if (view === 'home') {
    return (
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>✨ Rendez Vous</h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', maxWidth: '600px' }}>
            <button onClick={() => setView('client')} style={{ padding: '20px', background: 'white', color: '#667eea', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>👤 CLIENT</button>
            <button onClick={() => setView('salon')} style={{ padding: '20px', background: 'white', color: '#667eea', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>💇 SALON</button>
            <button onClick={() => setView('admin')} style={{ padding: '20px', background: 'white', color: '#667eea', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>⚙️ ADMIN</button>
          </div>
        </div>
      </div>
    );
  }

  // CLIENT VIEW
  if (view === 'client') {
    const filtered = salons.filter(s => s.city.toLowerCase().includes(city.toLowerCase()) && s.status === 'approved');
    return (
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh', padding: '20px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <button onClick={() => setView('home')} style={{ padding: '10px 20px', background: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '30px', fontWeight: 'bold' }}>← Retour</button>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '10px' }}>
            <input type="text" placeholder="Ville..." value={city} onChange={(e) => setCity(e.target.value)} style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }} />
            <button onClick={() => {}} style={{ padding: '10px 30px', background: '#667eea', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}>🔍 Rechercher</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {filtered.map(s => (
              <div key={s.id} style={{ background: 'white', borderRadius: '8px', padding: '20px', cursor: 'pointer' }}>
                <h3>{s.name}</h3>
                <p>📍 {s.city}</p>
                <p>⭐ {s.rating} ({s.reviews} avis)</p>
                <button onClick={() => setView(`salon-${s.id}`)} style={{ width: '100%', padding: '10px', background: '#667eea', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}>Voir</button>
              </div>
            ))}
          </div>
          {filtered.length === 0 && <p style={{ color: 'white', textAlign: 'center', marginTop: '30px' }}>Aucun salon trouvé</p>}
        </div>
      </div>
    );
  }

  // SALON LOGIN
  if (view === 'salon') {
    return (
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: 'white', borderRadius: '8px', padding: '40px', maxWidth: '400px', width: '100%' }}>
          <button onClick={() => setView('home')} style={{ padding: '8px 16px', background: '#f5f5f5', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '20px', fontWeight: 'bold' }}>← Retour</button>

          {!creating ? (
            <>
              <h2 style={{ marginBottom: '20px' }}>Connexion</h2>
              <input type="text" placeholder="Format: 1:salon" value={id} onChange={(e) => setId(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '15px' }} />
              <button onClick={() => {
                const [num, pwd] = id.split(':');
                if (pwd === 'salon' && salons.find(s => s.id === parseInt(num))) {
                  setView(`salon-dashboard-${num}`);
                } else {
                  alert('Identifiants incorrects');
                }
              }} style={{ width: '100%', padding: '10px', background: '#667eea', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '20px' }}>Se connecter</button>
              
              <hr style={{ margin: '20px 0' }} />
              
              <button onClick={() => setCreating(true)} style={{ width: '100%', padding: '10px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Créer salon</button>
            </>
          ) : (
            <>
              <h2 style={{ marginBottom: '20px' }}>Créer salon</h2>
              <input type="text" placeholder="Nom" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '10px' }} />
              <input type="text" placeholder="Ville" value={newCity} onChange={(e) => setNewCity(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '15px' }} />
              <button onClick={() => {
                if (newName && newCity) {
                  const newId = Math.max(...salons.map(s => s.id), 0) + 1;
                  setSalons([...salons, { id: newId, name: newName, city: newCity, address: '', phone: '', description: '', rating: 4.5, reviews: 0, services: [], staff: [], status: 'pending' }]);
                  alert(`Créé! ID: ${newId}\nIdentifiant: ${newId}:salon`);
                  setCreating(false);
                  setNewName('');
                  setNewCity('');
                }
              }} style={{ width: '100%', padding: '10px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px' }}>Créer</button>
              <button onClick={() => setCreating(false)} style={{ width: '100%', padding: '10px', background: '#999', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Annuler</button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ADMIN LOGIN
  if (view === 'admin') {
    return (
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: 'white', borderRadius: '8px', padding: '40px', maxWidth: '400px', width: '100%' }}>
          <button onClick={() => setView('home')} style={{ padding: '8px 16px', background: '#f5f5f5', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '20px', fontWeight: 'bold' }}>← Retour</button>
          <h2 style={{ marginBottom: '20px' }}>Admin</h2>
          <input type="password" placeholder="Password" value={pass} onChange={(e) => setPass(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '15px' }} />
          <button onClick={() => {
            if (pass === 'admin123') {
              setView('admin-dashboard');
            } else {
              alert('Incorrect');
            }
          }} style={{ width: '100%', padding: '10px', background: '#667eea', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Se connecter</button>
        </div>
      </div>
    );
  }

  // SALON DASHBOARD
  if (view.startsWith('salon-dashboard-')) {
    const salonId = parseInt(view.split('-')[2]);
    const salon = salons.find(s => s.id === salonId);

    return (
      <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <button onClick={() => setView('home')} style={{ padding: '10px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '20px', fontWeight: 'bold' }}>Accueil</button>
          <div style={{ background: 'white', borderRadius: '8px', padding: '30px' }}>
            <h2>{salon?.name}</h2>
            <p>Ville: {salon?.city}</p>
            <p>💡 Dashboard complet en développement</p>
          </div>
        </div>
      </div>
    );
  }

  // ADMIN DASHBOARD
  if (view === 'admin-dashboard') {
    return (
      <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '20px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <button onClick={() => setView('home')} style={{ padding: '10px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '20px', fontWeight: 'bold' }}>Accueil</button>
          <div style={{ background: 'white', borderRadius: '8px', padding: '30px' }}>
            <h2>Salons ({salons.length})</h2>
            {salons.map(s => (
              <div key={s.id} style={{ padding: '15px', background: '#f5f5f5', marginBottom: '10px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <div><p>{s.name} - {s.city}</p></div>
                {s.status === 'pending' && <button onClick={() => setSalons(salons.map(x => x.id === s.id ? {...x, status: 'approved'} : x))} style={{ padding: '5px 15px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Approuver</button>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // SALON PROFILE
  if (view.startsWith('salon-')) {
    const salonId = parseInt(view.split('-')[1]);
    const salon = salons.find(s => s.id === salonId);

    return (
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh', padding: '20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <button onClick={() => setView('client')} style={{ padding: '10px 20px', background: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '30px', fontWeight: 'bold' }}>← Retour</button>
          <div style={{ background: 'white', borderRadius: '12px', padding: '30px' }}>
            <h2>{salon?.name}</h2>
            <p>📍 {salon?.address}</p>
            <p>⭐ {salon?.rating}/5</p>
            <p style={{ marginTop: '20px', color: '#666' }}>{salon?.description}</p>
          </div>
        </div>
      </div>
    );
  }

  return <div style={{ color: 'white', padding: '20px', textAlign: 'center', background: '#667eea', minHeight: '100vh' }}>Page non trouvée</div>;
}
/* global __app_id, __firebase_config */
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, onSnapshot, doc, updateDoc, deleteDoc, query, where, setDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBi9P6Rc49Cxex3IhUIq2Pp4tXE1FVL_0Y",
    authDomain: "myt-otel.firebaseapp.com",
    projectId: "myt-otel",
    storageBucket: "myt-otel.firebasestorage.app",
    messagingSenderId: "674364386269",
    appId: "1:674364386269:web:4f5f7646fee48697aa6434",
    measurementId: "G-3XZCK2DXL7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

const ADMIN_EMAIL = 'admin@myhotel.com';

const getCollectionPath = (collectionName, isPublic = true, userId = null) => {
    if (isPublic) {
        return `artifacts/${appId}/public/data/${collectionName}`;
    } else {
        return `artifacts/${appId}/users/${userId}/${collectionName}`;
    }
};

export default function App() {
    const [path, setPath] = useState(window.location.pathname);
    const [user, setUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                try {
                    await signInAnonymously(auth);
                } catch (error) {
                    console.error("Anonim giriş başarısız oldu:", error);
                }
            }
            setLoadingAuth(false);
        });

        const handlePopState = () => {
            setPath(window.location.pathname);
        };
        window.addEventListener('popstate', handlePopState);

        return () => {
            unsubscribe();
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    const navigate = (newPath) => {
        window.history.pushState({}, '', newPath);
        setPath(newPath);
    };

    const isAdmin = user && user.email === ADMIN_EMAIL;

    let ComponentToRender;
    if (path === '/admin') {
        ComponentToRender = isAdmin ? <AdminPanel user={user} navigate={navigate} /> : <AdminLogin navigate={navigate} />;
    } else if (path === '/profile') {
        ComponentToRender = user && !user.isAnonymous ? <ProfilePage user={user} navigate={navigate} /> : <UserLogin navigate={navigate} />;
    } else if (path === '/register') {
        ComponentToRender = <UserRegister navigate={navigate} />;
    }
    else {
        ComponentToRender = <HomePage navigate={navigate} user={user} />;
    }

    return (
        <div className="min-h-screen bg-gray-50 font-inter">
            {ComponentToRender}
        </div>
    );
}

function Navbar({ navigate, user }) {
    const [isOpen, setIsOpen] = useState(false);
    const isAdmin = user && user.email === ADMIN_EMAIL;

    return (
        <nav className="bg-white shadow-lg fixed w-full z-10 top-0 rounded-b-lg">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <div className="flex items-center">
                    <button onClick={() => navigate('/')} className="text-2xl font-bold text-gray-800 hover:text-blue-600 transition duration-300">
                        Myt Otel
                    </button>
                </div>

                <div className="md:hidden">
                    <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 hover:text-gray-800 focus:outline-none focus:text-gray-800">
                        <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                            {isOpen ? (
                                <path fillRule="evenodd" clipRule="evenodd" d="M18.278 16.864a1 1 0 0 0 0-1.414l-4.243-4.243a1 1 0 1 0-1.414 1.414l4.243 4.243a1 1 0 0 0 1.414 0zM5.722 7.136a1 1 0 0 0 0 1.414l4.243 4.243a1 1 0 1 0 1.414-1.414L7.136 7.136a1 1 0 0 0-1.414 0z"/>
                            ) : (
                                <path fillRule="evenodd" d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 010-2zm0 6h16a1 1 0 010 2H4a1 1 0 010-2z"/>
                            )}
                        </svg>
                    </button>
                </div>

                <div className="hidden md:flex items-center space-x-6">
                    <button onClick={() => navigate('/')} className="text-gray-700 hover:text-blue-600 font-medium transition duration-300">
                        Anasayfa
                    </button>
                    <button onClick={() => { navigate('/'); setTimeout(() => document.getElementById('room-types-section')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="text-gray-700 hover:text-blue-600 font-medium transition duration-300">
                        Oda Tipleri
                    </button>
                    <button onClick={() => { navigate('/'); setTimeout(() => document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' }), 100); }} className="text-gray-700 hover:text-blue-600 font-medium transition duration-300">
                        Hakkımızda
                    </button>
                    {user && !user.isAnonymous ? (
                        <>
                            <button onClick={() => navigate('/profile')} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-md transition duration-300">
                                Profilim
                            </button>
                            {isAdmin && (
                                <button onClick={() => navigate('/admin')} className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full shadow-md transition duration-300">
                                    Admin Paneli
                                </button>
                            )}
                        </>
                    ) : (
                        <button onClick={() => navigate('/profile')} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-md transition duration-300">
                            Giriş Yap / Kayıt Ol
                        </button>
                    )}
                </div>
            </div>

            {isOpen && (
                <div className="md:hidden bg-white py-2 shadow-inner rounded-b-lg">
                    <button onClick={() => { navigate('/'); setIsOpen(false); }} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition duration-300">
                        Anasayfa
                    </button>
                    <button onClick={() => { navigate('/'); setTimeout(() => document.getElementById('room-types-section')?.scrollIntoView({ behavior: 'smooth' }), 100); setIsOpen(false); }} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition duration-300">
                        Oda Tipleri
                    </button>
                    <button onClick={() => { navigate('/'); setTimeout(() => document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' }), 100); setIsOpen(false); }} className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition duration-300">
                        Hakkımızda
                    </button>
                    {user && !user.isAnonymous ? (
                        <>
                            <button onClick={() => { navigate('/profile'); setIsOpen(false); }} className="block w-full text-left px-4 py-2 text-blue-700 hover:bg-gray-100 transition duration-300">
                                Profilim
                            </button>
                            {isAdmin && (
                                <button onClick={() => { navigate('/admin'); setIsOpen(false); }} className="block w-full text-left px-4 py-2 text-purple-700 hover:bg-gray-100 transition duration-300">
                                    Admin Paneli
                                </button>
                            )}
                        </>
                    ) : (
                        <button onClick={() => { navigate('/profile'); setIsOpen(false); }} className="block w-full text-left px-4 py-2 text-blue-700 hover:bg-gray-100 transition duration-300">
                            Giriş Yap / Kayıt Ol
                        </button>
                    )}
                </div>
            )}
        </nav>
    );
}

function HomePage({ navigate, user }) {
    const [roomTypes, setRoomTypes] = useState([]);
    const [showReservationForm, setShowReservationForm] = useState(false);
    const [selectedRoomType, setSelectedRoomType] = useState(null);
    const [showMessageBox, setShowMessageBox] = useState(false);
    const [messageContent, setMessageContent] = useState('');
    const [messageType, setMessageBoxType] = useState('');

    const aboutSections = [
        {
            title: "Konforlu Konaklama Deneyimi",
            description: "Myt Otel'de her odamız, misafirlerimizin konforu ve rahatlığı düşünülerek özenle tasarlanmıştır. Modern mobilyalar, lüks yatak takımları ve en yeni teknolojik olanaklar ile donatılmış odalarımızda, evinizdeki sıcaklığı ve huzuru bulacaksınız. Unutulmaz bir konaklama deneyimi için sizi bekliyoruz.",
            imageUrl: "https://images.unsplash.com/photo-1578683010236-d7168526d30b?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            imageLeft: true
        },
        {
            title: "Şehrin Kalbinde Merkezi Konum",
            description: "Myt Otel, şehrin en canlı ve merkezi noktalarından birinde konumlanmıştır. İş merkezlerine, alışveriş bölgelerine, tarihi ve kültürel mekanlara kolayca ulaşabilirsiniz. Toplu taşıma duraklarına yakınlığımız sayesinde şehrin her yerine rahatça erişim sağlayabilirsiniz.",
            imageUrl: "https://images.unsplash.com/photo-1582719478252-678ba461d1fc?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            imageLeft: false
        },
        {
            title: "Güler Yüzlü ve Profesyonel Hizmet",
            description: "Myt Otel ekibi olarak, misafir memnuniyetini en üst düzeyde tutmayı hedefliyoruz. Güler yüzlü ve deneyimli personelimiz, konaklamanız boyunca her türlü ihtiyacınızda size yardımcı olmaktan mutluluk duyacaktır. Kişiye özel hizmet anlayışımızla, kendinizi özel hissedeceksiniz.",
            imageUrl: "https://images.unsplash.com/photo-1551882547-ff40c6340428?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            imageLeft: true
        },
        {
            title: "Zengin Olanaklar ve Aktiviteler",
            description: "Konaklamanızı daha keyifli hale getirmek için çeşitli olanaklar sunuyoruz. Kapalı yüzme havuzumuzda serinleyebilir, tam donanımlı spor salonumuzda formunuzu koruyabilir, rahatlatıcı spa merkezimizde dinlenebilirsiniz. Ayrıca, otelimizin gurme restoranında eşsiz lezzetleri deneyimleyebilirsiniz.",
            imageUrl: "https://images.unsplash.com/photo-1571900138541-e47854483733?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            imageLeft: false
        }
    ];

    const defaultRoomTypeImages = [
        "https://images.unsplash.com/photo-1618773959845-749e75b927e5?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1590447190130-109062259160?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1582719473617-6d635c9110b6?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1543946207-39c065a4847e?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1582719502621-e8d1217e99b0?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1596394516010-cd177695029a?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    ];

    useEffect(() => {
        const roomTypesColRef = collection(db, getCollectionPath('roomTypes'));
        const unsubscribe = onSnapshot(roomTypesColRef, (snapshot) => {
            const types = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRoomTypes(types);
        }, (error) => {
            console.error("Oda türleri çekilirken hata oluştu:", error);
        });
        return () => unsubscribe();
    }, []);

    const showMessage = (message, type) => {
        setMessageContent(message);
        setMessageBoxType(type);
        setShowMessageBox(true);
        setTimeout(() => {
            setShowMessageBox(false);
            setMessageContent('');
        }, 3000);
    };

    const handleReserveClick = (roomType) => {
        if (!user || user.isAnonymous) {
            showMessage('Rezervasyon yapmak için lütfen giriş yapın veya kayıt olun.', 'error');
            navigate('/profile');
            return;
        }
        setSelectedRoomType(roomType);
        setShowReservationForm(true);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar navigate={navigate} user={user} />

            {showMessageBox && (
                <div className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${messageType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {messageContent}
                </div>
            )}

            <section
                className="relative h-96 md:h-[500px] bg-cover bg-center flex items-center justify-center text-white shadow-lg rounded-b-lg"
                style={{ backgroundImage: `url(https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)` }}
            >
                <div className="absolute inset-0 bg-black opacity-50 rounded-b-lg"></div>
                <div className="relative z-10 text-center p-4">
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
                        Myt Otel'e Hoş Geldiniz
                    </h1>
                    <p className="text-xl md:text-2xl font-light">
                        Konfor, Lüks ve Unutulmaz Anlar Bir Arada
                    </p>
                    <button
                        onClick={() => { setTimeout(() => document.getElementById('room-types-section')?.scrollIntoView({ behavior: 'smooth' }), 100); }}
                        className="mt-8 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-full shadow-lg transform hover:scale-105 transition duration-300"
                    >
                        Odalarımızı Keşfedin
                    </button>
                </div>
            </section>

            <div className="container mx-auto p-4 md:p-8 mt-8">
                <section id="about-section" className="bg-white p-6 rounded-lg shadow-md mb-12">
                    <h2 className="text-3xl font-semibold text-gray-800 mb-8 text-center">Neden Myt Otel?</h2>
                    {aboutSections.map((section, index) => (
                        <div
                            key={index}
                            className={`flex flex-col md:flex-row items-center gap-8 mb-12 last:mb-0 p-6 rounded-lg shadow-sm ${
                                section.imageLeft ? 'md:flex-row' : 'md:flex-row-reverse'
                            } bg-gray-50`}
                        >
                            <div className="w-full md:w-1/2">
                                <img
                                    src={section.imageUrl}
                                    alt={section.title}
                                    className="w-full h-64 object-cover rounded-lg shadow-md transform hover:scale-105 transition duration-300"
                                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x400/A0A0A0/ffffff?text=Resim+Yok"; }}
                                />
                            </div>
                            <div className="w-full md:w-1/2 text-center md:text-left">
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">{section.title}</h3>
                                <p className="text-gray-700 leading-relaxed">{section.description}</p>
                            </div>
                        </div>
                    ))}
                </section>

                <section id="room-types-section" className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">Oda Tiplerimiz</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {roomTypes.length > 0 ? (
                            roomTypes.map((room, index) => {
                                const availableRooms = room.totalRooms - (room.bookedRooms || 0);
                                return (
                                    <div key={room.id} className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition duration-300 bg-white transform hover:scale-105">
                                        <img
                                            src={room.imageUrl || defaultRoomTypeImages[index % defaultRoomTypeImages.length]}
                                            alt={room.name}
                                            className="w-full h-48 object-cover rounded-md mb-4 shadow-sm"
                                            onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x250/A0A0A0/ffffff?text=Resim+Yok"; }}
                                        />
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{room.name}</h3>
                                        <p className="text-gray-600 mb-2 text-sm">{room.description}</p>
                                        <p className="text-lg font-semibold text-blue-600 mb-3">Fiyat: {room.price} TL/Gece</p>
                                        <div className="text-sm text-gray-500 mb-3">
                                            <p>Toplam Oda: {room.totalRooms}</p>
                                            <p>Dolu Oda: {room.bookedRooms || 0}</p>
                                            <p>Mevcut Oda: {availableRooms}</p>
                                            <p>Durum: {availableRooms > 0 ? <span className="text-green-600 font-semibold">Müsait</span> : <span className="text-red-600 font-semibold">Dolu</span>}</p>
                                        </div>
                                        {availableRooms > 0 ? (
                                            <button
                                                onClick={() => handleReserveClick(room)}
                                                className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md transition duration-300 shadow-md"
                                            >
                                                Rezerve Et
                                            </button>
                                        ) : (
                                            <p className="text-red-600 font-semibold text-center mt-4 p-2 bg-red-50 rounded-md">Odalarımız Dolmuştur</p>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-gray-600 col-span-full text-center">Henüz oda tipi eklenmedi. Yönetici panelinden ekleyebilirsiniz.</p>
                        )}
                    </div>
                </section>

                {showReservationForm && selectedRoomType && (
                    <ReservationForm
                        roomType={selectedRoomType}
                        onClose={() => setShowReservationForm(false)}
                        user={user}
                        showMessage={showMessage}
                    />
                )}
            </div>
            <footer className="bg-gray-800 text-white p-6 mt-8 rounded-t-lg shadow-inner">
                <div className="container mx-auto text-center">
                    <p>&copy; {new Date().getFullYear()} Myt Otel. Tüm Hakları Saklıdır.</p>
                    <p className="text-sm mt-2">Adres: Örnek Mah. Örnek Cad. No:123, Şehir, Ülke</p>
                    <p className="text-sm">Telefon: +90 123 456 7890 | E-posta: info@mytotel.com</p>
                </div>
            </footer>
        </div>
    );
}

function ReservationForm({ roomType, onClose, user, showMessage }) {
    const [guestName, setGuestName] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [checkInDate, setCheckInDate] = useState('');
    const [checkOutDate, setCheckOutDate] = useState('');
    const [numGuests, setNumGuests] = useState(1);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user || user.isAnonymous) {
            showMessage('Rezervasyon yapmak için lütfen giriş yapın veya kayıt olun.', 'error');
            return;
        }

        if (!checkInDate || !checkOutDate || !guestName || !guestEmail) {
            showMessage('Lütfen tüm alanları doldurun.', 'error');
            return;
        }

        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (checkIn >= checkOut) {
            showMessage('Çıkış tarihi giriş tarihinden sonra olmalıdır.', 'error');
            return;
        }

        if (checkIn < today) {
            showMessage('Giriş tarihi bugünden önce olamaz.', 'error');
            return;
        }

        try {
            const reservationsColRef = collection(db, getCollectionPath('reservations', false, user.uid));
            const newReservationRef = doc(reservationsColRef);
            const reservationId = newReservationRef.id;

            await setDoc(newReservationRef, {
                guestName,
                guestEmail,
                checkInDate: checkInDate,
                checkOutDate: checkOutDate,
                roomTypeId: roomType.id,
                roomTypeName: roomType.name,
                numGuests: parseInt(numGuests),
                status: 'Beklemede',
                timestamp: new Date().toISOString(),
                userId: user.uid
            });

            const publicReservationsColRef = collection(db, getCollectionPath('reservations'));
            await setDoc(doc(publicReservationsColRef, reservationId), {
                guestName,
                guestEmail,
                checkInDate: checkInDate,
                checkOutDate: checkOutDate,
                roomTypeId: roomType.id,
                roomTypeName: roomType.name,
                numGuests: parseInt(numGuests),
                status: 'Beklemede',
                timestamp: new Date().toISOString(),
                userId: user.uid
            });


            const roomTypeDocRef = doc(db, getCollectionPath('roomTypes'), roomType.id);
            await updateDoc(roomTypeDocRef, {
                bookedRooms: (roomType.bookedRooms || 0) + 1
            });

            showMessage('Rezervasyonunuz başarıyla gönderildi! Onay için bekleyiniz.', 'success');
            setTimeout(() => {
                onClose();
            }, 3000);
        } catch (error) {
            console.error("Rezervasyon gönderilirken hata oluştu:", error);
            showMessage('Rezervasyon gönderilirken bir hata oluştu. Lütfen tekrar deneyin.', 'error');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Rezervasyon Yap: {roomType.name}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="guestName" className="block text-gray-700 text-sm font-bold mb-2">Ad Soyad:</label>
                        <input
                            type="text"
                            id="guestName"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="guestEmail" className="block text-gray-700 text-sm font-bold mb-2">E-posta:</label>
                        <input
                            type="email"
                            id="guestEmail"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={guestEmail}
                            onChange={(e) => setGuestEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="checkInDate" className="block text-gray-700 text-sm font-bold mb-2">Giriş Tarihi:</label>
                        <input
                            type="date"
                            id="checkInDate"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={checkInDate}
                            onChange={(e) => setCheckInDate(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="checkOutDate" className="block text-gray-700 text-sm font-bold mb-2">Çıkış Tarihi:</label>
                        <input
                            type="date"
                            id="checkOutDate"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={checkOutDate}
                            onChange={(e) => setCheckOutDate(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="numGuests" className="block text-gray-700 text-sm font-bold mb-2">Misafir Sayısı:</label>
                        <input
                            type="number"
                            id="numGuests"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={numGuests}
                            onChange={(e) => setNumGuests(e.target.value)}
                            min="1"
                            required
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition duration-300"
                        >
                            Rezervasyon Yap
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-gray-400 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition duration-300"
                        >
                            İptal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function UserLogin({ navigate }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/profile');
        } catch (err) {
            console.error("Giriş hatası:", err.code, err.message);
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('Yanlış e-posta veya şifre.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Geçersiz e-posta formatı.');
            } else {
                setError('Giriş yaparken bir hata oluştu. Lütfen tekrar deneyin.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Kullanıcı Girişi</h2>
                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">E-posta:</label>
                        <input
                            type="email"
                            id="email"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Şifre:</label>
                        <input
                            type="password"
                            id="password"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition duration-300"
                            disabled={loading}
                        >
                            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/register')}
                            className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
                        >
                            Hesabın yok mu? Kayıt Ol
                        </button>
                    </div>
                </form>
                <p className="text-center text-gray-600 text-sm mt-6">
                    Kullanıcı olarak giriş yapmak için, Firebase Authentication panelinde bir kullanıcı oluşturmanız gerekmektedir.
                </p>
            </div>
        </div>
    );
}

function UserRegister({ navigate }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { createUserWithEmailAndPassword } = await import('firebase/auth');
            await createUserWithEmailAndPassword(auth, email, password);
            navigate('/profile');
        } catch (err) {
            console.error("Kayıt hatası:", err.code, err.message);
            if (err.code === 'auth/email-already-in-use') {
                setError('Bu e-posta adresi zaten kullanılıyor.');
            } else if (err.code === 'auth/weak-password') {
                setError('Şifre en az 6 karakter olmalıdır.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Geçersiz e-posta formatı.');
            } else {
                setError('Kayıt olurken bir hata oluştu. Lütfen tekrar deneyin.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Kayıt Ol</h2>
                <form onSubmit={handleRegister}>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">E-posta:</label>
                        <input
                            type="email"
                            id="email"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Şifre:</label>
                        <input
                            type="password"
                            id="password"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition duration-300"
                            disabled={loading}
                        >
                            {loading ? 'Kayıt Olunuyor...' : 'Kayıt Ol'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/profile')}
                            className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
                        >
                            Zaten hesabın var mı? Giriş Yap
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}


function AdminLogin({ navigate }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            if (userCredential.user.email === ADMIN_EMAIL) {
            } else {
                await signOut(auth);
                setError('Sadece yöneticiler bu panele erişebilir.');
            }
        } catch (err) {
            console.error("Giriş hatası:", err.code, err.message);
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('Yanlış e-posta veya şifre.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Geçersiz e-posta formatı.');
            } else {
                setError('Giriş yaparken bir hata oluştu. Lütfen tekrar deneyin.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Yönetici Girişi</h2>
                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">E-posta:</label>
                        <input
                            type="email"
                            id="email"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Şifre:</label>
                        <input
                            type="password"
                            id="password"
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition duration-300"
                            disabled={loading}
                        >
                            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="bg-gray-400 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md focus:outline-none focus:shadow-outline transition duration-300"
                        >
                            Anasayfa
                        </button>
                    </div>
                </form>
                <p className="text-center text-gray-600 text-sm mt-6">
                    Yönetici olarak giriş yapmak için, Firebase Authentication panelinde `admin@myhotel.com` e-postası ve belirlediğiniz bir şifre ile bir kullanıcı oluşturmanız gerekmektedir.
                </p>
            </div>
        </div>
    );
}

function AddRoomTypeForm({ showMessage }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [totalRooms, setTotalRooms] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const roomTypesColRef = collection(db, getCollectionPath('roomTypes'));
            await addDoc(roomTypesColRef, {
                name,
                description,
                price: parseFloat(price),
                totalRooms: parseInt(totalRooms),
                bookedRooms: 0,
                imageUrl
            });
            showMessage('Oda tipi başarıyla eklendi!', 'success');
            setName('');
            setDescription('');
            setPrice('');
            setTotalRooms('');
            setImageUrl('');
        } catch (error) {
            console.error("Oda tipi eklenirken hata:", error);
            showMessage('Oda tipi eklenirken bir hata oluştu.', 'error');
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-200">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4 pb-2 border-b">Yeni Oda Tipi Ekle</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="roomName" className="block text-gray-700 text-sm font-bold mb-1">Oda Adı:</label>
                    <input
                        type="text"
                        id="roomName"
                        className="shadow-sm appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="roomPrice" className="block text-gray-700 text-sm font-bold mb-1">Fiyat (TL):</label>
                    <input
                        type="number"
                        id="roomPrice"
                        className="shadow-sm appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        min="0"
                        step="0.01"
                        required
                    />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="roomDescription" className="block text-gray-700 text-sm font-bold mb-1">Açıklama:</label>
                    <textarea
                        id="roomDescription"
                        className="shadow-sm appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows="3"
                        required
                    ></textarea>
                </div>
                <div>
                    <label htmlFor="totalRooms" className="block text-gray-700 text-sm font-bold mb-1">Toplam Oda Sayısı:</label>
                    <input
                        type="number"
                        id="totalRooms"
                        className="shadow-sm appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                        value={totalRooms}
                        onChange={(e) => setTotalRooms(e.target.value)}
                        min="1"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="imageUrl" className="block text-gray-700 text-sm font-bold mb-1">Görsel URL'si:</label>
                    <input
                        type="url"
                        id="imageUrl"
                        className="shadow-sm appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://example.com/oda-resmi.jpg"
                    />
                </div>
                <div className="md:col-span-2 flex justify-end mt-4">
                    <button
                        type="submit"
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-5 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition duration-300 shadow-lg"
                    >
                        Oda Tipi Ekle
                    </button>
                </div>
            </form>
        </div>
    );
}

function UpdateRoomTypeForm({ roomType, showMessage }) {
    const [name, setName] = useState(roomType.name);
    const [description, setDescription] = useState(roomType.description);
    const [price, setPrice] = useState(roomType.price);
    const [totalRooms, setTotalRooms] = useState(roomType.totalRooms);
    const [imageUrl, setImageUrl] = useState(roomType.imageUrl || '');
    const [showForm, setShowForm] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const roomTypeDocRef = doc(db, getCollectionPath('roomTypes'), roomType.id);
            await updateDoc(roomTypeDocRef, {
                name,
                description,
                price: parseFloat(price),
                totalRooms: parseInt(totalRooms),
                imageUrl
            });
            showMessage('Oda tipi başarıyla güncellendi!', 'success');
            setShowForm(false);
        } catch (error) {
            console.error("Oda tipi güncellenirken hata:", error);
            showMessage('Oda tipi güncellenirken bir hata oluştu.', 'error');
        }
    };

    return (
        <div>
            <button
                onClick={() => setShowForm(!showForm)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition duration-300 shadow-md text-sm"
            >
                {showForm ? 'İptal' : 'Düzenle'}
            </button>

            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md transform scale-105 transition-transform duration-300">
                        <h3 className="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b">Oda Tipi Düzenle: {roomType.name}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label htmlFor={`update-roomName-${roomType.id}`} className="block text-gray-700 text-sm font-bold mb-1">Oda Adı:</label>
                                <input
                                    type="text"
                                    id={`update-roomName-${roomType.id}`}
                                    className="shadow-sm appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor={`update-roomPrice-${roomType.id}`} className="block text-gray-700 text-sm font-bold mb-1">Fiyat (TL):</label>
                                <input
                                    type="number"
                                    id={`update-roomPrice-${roomType.id}`}
                                    className="shadow-sm appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor={`update-roomDescription-${roomType.id}`} className="block text-gray-700 text-sm font-bold mb-1">Açıklama:</label>
                                <textarea
                                    id={`update-roomDescription-${roomType.id}`}
                                    className="shadow-sm appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows="3"
                                    required
                                ></textarea>
                            </div>
                            <div className="mb-6">
                                <label htmlFor={`update-totalRooms-${roomType.id}`} className="block text-gray-700 text-sm font-bold mb-1">Toplam Oda Sayısı:</label>
                                <input
                                    type="number"
                                    id={`update-totalRooms-${roomType.id}`}
                                    className="shadow-sm appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                    value={totalRooms}
                                    onChange={(e) => setTotalRooms(e.target.value)}
                                    min="1"
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label htmlFor={`update-imageUrl-${roomType.id}`} className="block text-gray-700 text-sm font-bold mb-1">Görsel URL'si:</label>
                                <input
                                    type="url"
                                    id={`update-imageUrl-${roomType.id}`}
                                    className="shadow-sm appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="https://example.com/oda-resmi.jpg"
                                />
                            </div>
                            <div className="flex items-center justify-end space-x-3">
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300 shadow-lg"
                                >
                                    Güncelle
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-5 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition duration-300"
                                >
                                    İptal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function AdminPanel({ user, navigate }) {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [reservations, setReservations] = useState([]);
    const [roomTypes, setRoomTypes] = useState([]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [actionToConfirm, setActionToConfirm] = useState(null);
    const [showMessageBox, setShowMessageBox] = useState(false);
    const [messageContent, setMessageContent] = useState('');
    const [messageType, setMessageBoxType] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    const showMessage = (message, type) => {
        setMessageContent(message);
        setMessageBoxType(type);
        setShowMessageBox(true);
        setTimeout(() => {
            setShowMessageBox(false);
            setMessageContent('');
        }, 3000);
    };

    useEffect(() => {
        if (!user || user.email !== ADMIN_EMAIL) return;

        const reservationsColRef = collection(db, getCollectionPath('reservations'));
        const unsubscribeReservations = onSnapshot(reservationsColRef, (snapshot) => {
            const res = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setReservations(res.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
        }, (error) => {
            showMessage('Rezervasyonlar yüklenirken bir hata oluştu.', 'error');
        });

        const roomTypesColRef = collection(db, getCollectionPath('roomTypes'));
        const unsubscribeRoomTypes = onSnapshot(roomTypesColRef, (snapshot) => {
            const types = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRoomTypes(types);
        }, (error) => {
            showMessage('Oda türleri yüklenirken bir hata oluştu.', 'error');
        });

        return () => {
            unsubscribeReservations();
            unsubscribeRoomTypes();
        };
    }, [user]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/admin');
        } catch (error) {
            console.error("Çıkış yaparken hata oluştu:", error);
            showMessage('Çıkış yaparken bir hata oluştu.', 'error');
        }
    };

    const handleUpdateReservationStatus = async (reservationId, newStatus, roomTypeId, userId) => {
        try {
            const reservationDocRef = doc(db, getCollectionPath('reservations'), reservationId);
            await updateDoc(reservationDocRef, { status: newStatus });

            if (userId) {
                const userReservationDocRef = doc(db, getCollectionPath('reservations', false, userId), reservationId);
                await setDoc(userReservationDocRef, { status: newStatus }, { merge: true });
            }

            if (roomTypeId) {
                const roomTypeDocRef = doc(db, getCollectionPath('roomTypes'), roomTypeId);
                const currentRoomType = roomTypes.find(rt => rt.id === roomTypeId);
                console.log("handleUpdateReservationStatus - currentRoomType:", currentRoomType);
                if (currentRoomType) {
                    const oldReservation = reservations.find(res => res.id === reservationId);
                    console.log("handleUpdateReservationStatus - oldReservation:", oldReservation);

                    let newBookedRooms = currentRoomType.bookedRooms || 0;

                    if (newStatus === 'İptal Edildi' && oldReservation?.status !== 'İptal Edildi') {
                        newBookedRooms = Math.max(0, newBookedRooms - 1);
                        console.log("Oda durumu 'İptal Edildi' olarak güncellendi, dolu oda sayısı azaltıldı:", newBookedRooms);
                    } else if (newStatus === 'Onaylandı' && oldReservation?.status === 'İptal Edildi') {
                        newBookedRooms = newBookedRooms + 1;
                        console.log("İptal edilmiş rezervasyon onaylandı, dolu oda sayısı artırıldı:", newBookedRooms);
                    }
                    await updateDoc(roomTypeDocRef, { bookedRooms: newBookedRooms });
                } else {
                    console.warn("RoomType not found for ID:", roomTypeId);
                }
            }
            showMessage('Rezervasyon durumu güncellendi.', 'success');
        } catch (error) {
            console.error("Rezervasyon durumu güncellenirken hata:", error);
            showMessage('Durum güncellenirken bir hata oluştu.', 'error');
        }
    };


    const handleDeleteReservation = async (reservationId, roomTypeId, userId) => {
        try {
            const reservationDocRef = doc(db, getCollectionPath('reservations'), reservationId);
            await deleteDoc(reservationDocRef);

            if (userId) {
                const userReservationDocRef = doc(db, getCollectionPath('reservations', false, userId), reservationId);
                await deleteDoc(userReservationDocRef);
            }

            if (roomTypeId) {
                const roomTypeDocRef = doc(db, getCollectionPath('roomTypes'), roomTypeId);
                const currentRoomType = roomTypes.find(rt => rt.id === roomTypeId);
                console.log("handleDeleteReservation - currentRoomType:", currentRoomType);
                if (currentRoomType) {
                    await updateDoc(roomTypeDocRef, {
                        bookedRooms: Math.max(0, (currentRoomType.bookedRooms || 0) - 1)
                    });
                    console.log("Rezervasyon silindi, dolu oda sayısı azaltıldı:", Math.max(0, (currentRoomType.bookedRooms || 0) - 1));
                } else {
                    console.warn("RoomType not found for ID during deletion:", roomTypeId);
                }
            }
            showMessage('Rezervasyon başarıyla silindi.', 'success');
        } catch (error) {
            console.error("Rezervasyon silinirken hata:", error);
            showMessage('Rezervasyon silinirken bir hata oluştu.', 'error');
        } finally {
            setShowConfirmModal(false);
            setActionToConfirm(null);
        }
    };

    const handleDeleteRoomType = async (roomTypeId) => {
        try {
            const roomTypeDocRef = doc(db, getCollectionPath('roomTypes'), roomTypeId);
            await deleteDoc(roomTypeDocRef);
            showMessage('Oda tipi başarıyla silindi.', 'success');
        } catch (error) {
            console.error("Oda tipi silinirken hata:", error);
            showMessage('Oda tipi silinirken bir hata oluştu.', 'error');
        } finally {
            setShowConfirmModal(false);
            setActionToConfirm(null);
        }
    };

    const confirmAction = (type, id, extraData = {}) => {
        setActionToConfirm({ type, id, ...extraData });
        setShowConfirmModal(true);
    };

    const handleConfirm = () => {
        if (actionToConfirm.type === 'deleteReservation') {
            handleDeleteReservation(actionToConfirm.id, actionToConfirm.roomTypeId, actionToConfirm.userId);
        } else if (actionToConfirm.type === 'deleteRoomType') {
            handleDeleteRoomType(actionToConfirm.id);
        }
    };

    const totalReservations = reservations.length;
    const pendingReservations = reservations.filter(res => res.status === 'Beklemede').length;
    const confirmedReservations = reservations.filter(res => res.status === 'Onaylandı').length;
    const totalRoomsCount = roomTypes.reduce((sum, room) => sum + room.totalRooms, 0);
    const bookedRoomsCount = roomTypes.reduce((sum, room) => sum + (room.bookedRooms || 0), 0);
    const availableRoomsCount = totalRoomsCount - bookedRoomsCount;

    const getRoomPrice = (roomTypeId) => {
        const room = roomTypes.find(r => r.id === roomTypeId);
        return room ? Number(room.price) : 0;
    };

    const filteredReservations = reservations.filter(res => {
        if (!filterStartDate && !filterEndDate) return true;
        const checkIn = new Date(res.checkInDate);
        if (filterStartDate && checkIn < new Date(filterStartDate)) return false;
        if (filterEndDate && checkIn > new Date(filterEndDate)) return false;
        return true;
    });

    const totalAmount = filteredReservations.reduce((sum, res) => {
        if (res.status === 'Onaylandı') {
            const price = getRoomPrice(res.roomTypeId);
            const nights = Math.max(1, (new Date(res.checkOutDate) - new Date(res.checkInDate)) / (1000 * 60 * 60 * 24));
            return sum + price * nights;
        }
        return sum;
    }, 0);

    return (
        <div className="min-h-screen bg-gray-100 flex">
            <aside className="w-64 bg-gray-800 text-white flex flex-col p-4 shadow-lg fixed h-full">
                <div className="text-2xl font-bold text-center mb-8 mt-4 tracking-wide">
                    Myt Otel Admin
                </div>
                <nav className="flex-1">
                    <ul>
                        <li className="mb-2">
                            <button
                                onClick={() => setActiveTab('dashboard')}
                                className={`w-full text-left px-4 py-2 rounded-md flex items-center space-x-3 transition duration-200 ${activeTab === 'dashboard' ? 'bg-purple-600 text-white shadow-md' : 'hover:bg-gray-700 text-gray-300'}`}
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                <span>Dashboard</span>
                            </button>
                        </li>
                        <li className="mb-2">
                            <button
                                onClick={() => setActiveTab('reservations')}
                                className={`w-full text-left px-4 py-2 rounded-md flex items-center space-x-3 transition duration-200 ${activeTab === 'reservations' ? 'bg-purple-600 text-white shadow-md' : 'hover:bg-gray-700 text-gray-300'}`}
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                <span>Rezervasyonlar</span>
                            </button>
                        </li>
                        <li className="mb-2">
                            <button
                                onClick={() => setActiveTab('roomTypes')}
                                className={`w-full text-left px-4 py-2 rounded-md flex items-center space-x-3 transition duration-200 ${activeTab === 'roomTypes' ? 'bg-purple-600 text-white shadow-md' : 'hover:bg-gray-700 text-gray-300'}`}
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2h14zM4 14h6m-6 0v-2" />
                                </svg>
                                <span>Oda Yönetimi</span>
                            </button>
                        </li>
                        <li className="mb-2">
                            <button
                                onClick={() => navigate('/')}
                                className="w-full text-left px-4 py-2 rounded-md flex items-center space-x-3 transition duration-200 hover:bg-gray-700 text-gray-300"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                <span>Anasayfaya Dön</span>
                            </button>
                        </li>
                    </ul>
                </nav>
                <div className="mt-auto pt-4 border-t border-gray-700">
                    <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md shadow-md transition duration-300 flex items-center justify-center space-x-2"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Çıkış Yap</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 ml-64 p-8 bg-gray-100">
                <header className="bg-white p-6 rounded-lg shadow-md mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">
                            {activeTab === 'dashboard' && 'Dashboard'}
                            {activeTab === 'reservations' && 'Rezervasyon Yönetimi'}
                            {activeTab === 'roomTypes' && 'Oda Tipleri Yönetimi'}
                        </h1>
                        <p className="text-gray-600 mt-1">Hoş geldiniz, {user?.email || 'Admin'}!</p>
                    </div>
                </header>
                {showMessageBox && (
                    <div className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${messageType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                        {messageContent}
                    </div>
                )}
                {activeTab === 'dashboard' && (
                    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-lg shadow-md border border-blue-200">
                            <h3 className="text-lg font-semibold text-blue-700 mb-2">Toplam Rezervasyonlar</h3>
                            <p className="text-4xl font-bold text-blue-900">{totalReservations}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md border border-yellow-200">
                            <h3 className="text-lg font-semibold text-yellow-700 mb-2">Bekleyen Rezervasyonlar</h3>
                            <p className="text-4xl font-bold text-yellow-900">{pendingReservations}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md border border-green-200">
                            <h3 className="text-lg font-semibold text-green-700 mb-2">Onaylanmış Rezervasyonlar</h3>
                            <p className="text-4xl font-bold text-green-900">{confirmedReservations}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md border border-purple-200">
                            <h3 className="text-lg font-semibold text-purple-700 mb-2">Toplam Oda Sayısı</h3>
                            <p className="text-4xl font-bold text-purple-900">{totalRoomsCount}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md border border-red-200">
                            <h3 className="text-lg font-semibold text-red-700 mb-2">Dolu Oda Sayısı</h3>
                            <p className="text-4xl font-bold text-red-900">{bookedRoomsCount}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md border border-teal-200">
                            <h3 className="text-lg font-semibold text-teal-700 mb-2">Mevcut Oda Sayısı</h3>
                            <p className="text-4xl font-bold text-teal-900">{availableRoomsCount}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-md border border-indigo-200">
                            <h3 className="text-lg font-semibold text-indigo-700 mb-2">Toplam Tutar (Onaylı)</h3>
                            <p className="text-4xl font-bold text-indigo-900">{totalAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 })}</p>
                        </div>
                    </section>
                )}
                {activeTab === 'reservations' && (
                    <section className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6 pb-4 border-b">Tüm Rezervasyonlar</h2>
                        <div className="flex flex-wrap gap-4 mb-6">
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Giriş Tarihi (Başlangıç):</label>
                                <input
                                    type="date"
                                    value={filterStartDate}
                                    onChange={e => setFilterStartDate(e.target.value)}
                                    className="border rounded px-2 py-1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Giriş Tarihi (Bitiş):</label>
                                <input
                                    type="date"
                                    value={filterEndDate}
                                    onChange={e => setFilterEndDate(e.target.value)}
                                    className="border rounded px-2 py-1"
                                />
                            </div>
                            <button
                                onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }}
                                className="self-end bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded"
                            >
                                Temizle
                            </button>
                        </div>
                        {filteredReservations.length === 0 ? (
                            <p className="text-gray-600 text-center py-8">Henüz hiç rezervasyon yok.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white rounded-lg overflow-hidden border border-gray-200">
                                    <thead className="bg-gray-100 border-b border-gray-200">
                                        <tr>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Misafir</th>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">E-posta</th>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Oda Tipi</th>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Giriş</th>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Çıkış</th>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Misafir Sayısı</th>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Oda Ücreti</th>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Durum</th>
                                            <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">İşlemler</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredReservations.map((res, index) => (
                                            <tr key={res.id} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition duration-150`}>
                                                <td className="py-3 px-4 text-sm text-gray-800">{res.guestName}</td>
                                                <td className="py-3 px-4 text-sm text-gray-800">{res.guestEmail}</td>
                                                <td className="py-3 px-4 text-sm text-gray-800">{res.roomTypeName}</td>
                                                <td className="py-3 px-4 text-sm text-gray-800">{res.checkInDate}</td>
                                                <td className="py-3 px-4 text-sm text-gray-800">{res.checkOutDate}</td>
                                                <td className="py-3 px-4 text-sm text-gray-800">{res.numGuests}</td>
                                                <td className="py-3 px-4 text-sm text-gray-800">
                                                    {getRoomPrice(res.roomTypeId).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                                                        res.status === 'Beklemede' ? 'bg-yellow-200 text-yellow-800' :
                                                        res.status === 'Onaylandı' ? 'bg-green-200 text-green-800' :
                                                        'bg-red-200 text-red-800'
                                                    }`}>
                                                        {res.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 flex flex-wrap gap-2">
                                                    {res.status === 'Beklemede' && (
                                                        <button
                                                            onClick={() => handleUpdateReservationStatus(res.id, 'Onaylandı', res.roomTypeId, res.userId)}
                                                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm font-semibold shadow-md transition duration-300"
                                                        >
                                                            Onayla
                                                        </button>
                                                    )}
                                                    {res.status !== 'İptal Edildi' && (
                                                        <button
                                                            onClick={() => handleUpdateReservationStatus(res.id, 'İptal Edildi', res.roomTypeId, res.userId)}
                                                            className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded-md text-sm font-semibold shadow-md transition duration-300"
                                                        >
                                                            İptal Et
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => confirmAction('deleteReservation', res.id, { roomTypeId: res.roomTypeId, userId: res.userId })}
                                                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm font-semibold shadow-md transition duration-300"
                                                    >
                                                        Sil
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                )}
                {activeTab === 'roomTypes' && (
                    <section className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6 pb-4 border-b">Oda Tipleri Yönetimi</h2>
                        <AddRoomTypeForm showMessage={showMessage} />

                        <h3 className="text-xl font-semibold text-gray-800 mb-4 mt-8">Mevcut Oda Tipleri</h3>
                        {roomTypes.length === 0 ? (
                            <p className="text-gray-600 text-center py-8">Henüz hiç oda tipi eklenmedi.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {roomTypes.map((room) => (
                                    <div key={room.id} className="border border-gray-200 rounded-lg p-5 shadow-md bg-white hover:shadow-lg transition duration-200 flex flex-col">
                                        {room.imageUrl && (
                                            <img
                                                src={room.imageUrl}
                                                alt={room.name}
                                                className="w-full h-40 object-cover rounded-md mb-4 shadow-sm"
                                                onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x250/A0A0A0/ffffff?text=Resim+Yok"; }}
                                            />
                                        )}
                                        <h4 className="text-xl font-bold text-gray-900 mb-2">{room.name}</h4>
                                        <p className="text-gray-600 mb-1 text-sm flex-grow">{room.description}</p>
                                        <p className="text-lg font-semibold text-blue-600 mb-3">Fiyat: {room.price} TL</p>
                                        <div className="text-sm text-gray-500 mb-3">
                                            <p>Toplam Oda: {room.totalRooms}</p>
                                            <p>Dolu Oda: {room.bookedRooms || 0}</p>
                                            <p>Mevcut Oda: {room.totalRooms - (room.bookedRooms || 0)}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                                            <UpdateRoomTypeForm roomType={room} showMessage={showMessage} />
                                            <button
                                                onClick={() => confirmAction('deleteRoomType', room.id)}
                                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-semibold shadow-md transition duration-300 text-sm"
                                            >
                                                Sil
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </main>

            {showConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-sm text-center transform scale-105 transition-transform duration-300">
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">Emin Misiniz?</h3>
                        <p className="text-gray-700 mb-6">Bu işlemi geri alamazsınız. Devam etmek istediğinizden emin misiniz?</p>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={handleConfirm}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-5 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-300"
                            >
                                Evet, Eminim
                            </button>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-5 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition duration-300"
                            >
                                İptal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ProfilePage({ user, navigate }) {
    const [userReservations, setUserReservations] = useState([]);
    const [showMessageBox, setShowMessageBox] = useState(false);
    const [messageContent, setMessageContent] = useState('');
    const [messageType, setMessageBoxType] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [reservationToCancel, setReservationToCancel] = useState(null);
    const [roomTypes, setRoomTypes] = useState([]);

    const showMessage = (message, type) => {
        setMessageContent(message);
        setMessageBoxType(type);
        setShowMessageBox(true);
        setTimeout(() => {
            setShowMessageBox(false);
            setMessageContent('');
        }, 3000);
    };

    useEffect(() => {
        if (!user || user.isAnonymous || !user.uid) {
            showMessage('Rezervasyonlarınızı görmek için giriş yapmalısınız.', 'error');
            setUserReservations([]);
            return;
        }

        const reservationsColRef = collection(db, getCollectionPath('reservations', false, user.uid));
        const unsubscribeReservations = onSnapshot(reservationsColRef, (snapshot) => {
            const res = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUserReservations(res.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
        }, (error) => {
            showMessage('Rezervasyonlarınız yüklenirken bir hata oluştu.', 'error');
        });

        const roomTypesColRef = collection(db, getCollectionPath('roomTypes'));
        const unsubscribeRoomTypes = onSnapshot(roomTypesColRef, (snapshot) => {
            const types = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRoomTypes(types);
        }, (error) => {});
        return () => {
            unsubscribeReservations();
            unsubscribeRoomTypes();
        };
    }, [user]);

    const getRoomInfo = (roomTypeId) => {
        const room = roomTypes.find(r => r.id === roomTypeId);
        return room || {};
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            showMessage('Çıkış yaparken bir hata oluştu.', 'error');
        }
    };

    const confirmCancel = (reservation) => {
        setReservationToCancel(reservation);
        setShowConfirmModal(true);
    };

    const handleCancelReservation = async () => {
        if (!reservationToCancel) return;

        const { id: reservationId, roomTypeId, userId } = reservationToCancel;

        try {
            const userReservationDocRef = doc(db, getCollectionPath('reservations', false, userId), reservationId);
            await updateDoc(userReservationDocRef, { status: 'İptal Edildi' });

            const publicReservationDocRef = doc(db, getCollectionPath('reservations'), reservationId);
            await updateDoc(publicReservationDocRef, { status: 'İptal Edildi' });

            if (roomTypeId) {
                const roomTypeDocRef = doc(db, getCollectionPath('roomTypes'), roomTypeId);
                const currentRoomType = roomTypes.find(rt => rt.id === roomTypeId);
                if (currentRoomType) {
                    await updateDoc(roomTypeDocRef, {
                        bookedRooms: Math.max(0, (currentRoomType.bookedRooms || 0) - 1)
                    });
                }
            }

            showMessage('Rezervasyon başarıyla iptal edildi.', 'success');
        } catch (error) {
            console.error("Rezervasyon iptal edilirken hata:", error);
            showMessage('Rezervasyon iptal edilirken bir hata oluştu. Lütfen tekrar deneyin.', 'error');
        } finally {
            setShowConfirmModal(false);
            setReservationToCancel(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar navigate={navigate} user={user} />
            {showMessageBox && (
                <div className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${messageType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {messageContent}
                </div>
            )}
            <main className="flex-1 p-4 md:p-8 mt-20">
                <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 rounded-lg shadow-xl mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight">Profilim</h1>
                        <p className="text-lg opacity-90 mt-1">Hoş geldiniz, {user?.email || 'Misafir'}!</p>
                        {user && !user.isAnonymous && (
                            <p className="text-sm mt-2 flex items-center">
                                <svg className="h-4 w-4 mr-1 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2v5a2 2 0 01-2 2h-5a2 2 0 01-2-2V9a2 2 0 012-2h5z" />
                                </svg>
                                Kullanıcı ID: <span className="font-mono text-blue-100 ml-1 break-all">{user.uid}</span>
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full shadow-lg transform hover:scale-105 transition duration-300 flex items-center space-x-2"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Çıkış Yap</span>
                    </button>
                </header>

                <section className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6 pb-4 border-b">Rezervasyonlarım</h2>
                    {userReservations.length === 0 ? (
                        user && !user.isAnonymous ? (
                            <p className="text-gray-600 text-center py-8">Henüz hiç rezervasyonunuz bulunmamaktadır.</p>
                        ) : (
                            <p className="text-gray-600 text-center py-8">Rezervasyonlarınızı görmek için lütfen giriş yapın.</p>
                        )
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {userReservations.map((res, index) => {
                                const room = getRoomInfo(res.roomTypeId);
                                const availableRooms = room.totalRooms ? room.totalRooms - (room.bookedRooms || 0) : '-';
                                return (
                                    <div key={res.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 hover:shadow-md transition duration-200 flex flex-col">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">{res.roomTypeName}</h3>
                                        <div className="text-gray-700 text-sm mb-3 flex-grow">
                                            <p><span className="font-semibold">Giriş:</span> {res.checkInDate}</p>
                                            <p><span className="font-semibold">Çıkış:</span> {res.checkOutDate}</p>
                                            <p><span className="font-semibold">Misafir Sayısı:</span> {res.numGuests}</p>
                                            <p><span className="font-semibold">Oda Ücreti:</span> {room.price ? `${room.price} TL/Gece` : '-'}</p>
                                            <p><span className="font-semibold">Müsaitlik:</span> {availableRooms > 0 ? <span className="text-green-600 font-semibold">Müsait</span> : <span className="text-red-600 font-semibold">Dolu</span>}</p>
                                            <p className="mt-2">
                                                <span className="font-semibold">Durum: </span>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                                                    res.status === 'Beklemede' ? 'bg-yellow-200 text-yellow-800' :
                                                    res.status === 'Onaylandı' ? 'bg-green-200 text-green-800' :
                                                    'bg-red-200 text-red-800'
                                                }`}>
                                                    {res.status}
                                                </span>
                                            </p>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-auto pt-3 border-t border-gray-100">
                                            Rezervasyon Tarihi: {new Date(res.timestamp).toLocaleDateString('tr-TR', {
                                                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </p>
                                        {res.status === 'Beklemede' && (
                                            <button
                                                onClick={() => confirmCancel(res)}
                                                className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md font-semibold shadow-md transition duration-300"
                                            >
                                                Rezervasyonu İptal Et
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>
            <footer className="bg-gray-800 text-white p-6 mt-8 rounded-t-lg shadow-inner">
                <div className="container mx-auto text-center">
                    <p>&copy; {new Date().getFullYear()} Myt Otel. Tüm Hakları Saklıdır.</p>
                    <p className="text-sm mt-2">Adres: Örnek Mah. Örnek Cad. No:123, Şehir, Ülke</p>
                    <p className="text-sm">Telefon: +90 123 456 7890 | E-posta: info@mytotel.com</p>
                </div>
            </footer>

            {showConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-sm text-center transform scale-105 transition-transform duration-300 border border-gray-300">
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">Rezervasyonu İptal Et?</h3>
                        <p className="text-gray-700 mb-6">Bu rezervasyonu iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</p>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={handleCancelReservation}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-5 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition duration-300"
                            >
                                Evet, İptal Et
                            </button>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-5 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition duration-300"
                            >
                                Vazgeç
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

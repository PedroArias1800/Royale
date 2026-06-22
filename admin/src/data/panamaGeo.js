export const PROVINCES = [
    'Bocas del Toro', 'Chiriquí', 'Coclé', 'Colón', 'Darién',
    'Herrera', 'Los Santos', 'Panamá', 'Panamá Oeste', 'Veraguas',
    'Guna Yala', 'Emberá-Wounaan', 'Ngäbe-Buglé',
];

export const DISTRICTS = {
    'Bocas del Toro': ['Almirante', 'Bocas del Toro', 'Changuinola', 'Chiriquí Grande'],
    'Chiriquí': ['Alanje', 'Barú', 'Boquete', 'Boquerón', 'Bugaba', 'David', 'Dolega', 'Gualaca', 'Remedios', 'Renacimiento', 'San Félix', 'San Lorenzo', 'Tolé'],
    'Coclé': ['Aguadulce', 'Antón', 'La Pintada', 'Natá', 'Olá', 'Penonomé'],
    'Colón': ['Chagres', 'Colón', 'Donoso', 'Omar Torrijos', 'Portobelo', 'Santa Isabel'],
    'Darién': ['Chepigana', 'Pinogana'],
    'Herrera': ['Chitré', 'Las Minas', 'Los Pozos', 'Ocú', 'Parita', 'Pesé', 'Santa María'],
    'Los Santos': ['Guararé', 'Las Tablas', 'Los Santos', 'Macaracas', 'Pedasí', 'Pocrí', 'Tonosí'],
    'Panamá': ['Balboa', 'Chepo', 'Chimán', 'Panamá', 'San Miguelito', 'Taboga'],
    'Panamá Oeste': ['Arraiján', 'Bejuco', 'Capira', 'Chame', 'La Chorrera', 'San Carlos'],
    'Veraguas': ['Atalaya', 'Calobre', 'Cañazas', 'La Mesa', 'Las Palmas', 'Mariato', 'Montijo', 'Río de Jesús', 'San Francisco', 'Santa Fe', 'Santiago', 'Soná'],
    'Guna Yala': ['Guna Yala'],
    'Emberá-Wounaan': ['Cémaco', 'Sambú'],
    'Ngäbe-Buglé': ['Besiko', 'Kankintú', 'Kusapín', 'Mironó', 'Müna', 'Nole Duima', 'Ñürüm'],
};

// Corregimientos por provincia → distrito
export const CORREGIMIENTOS = {
    'Panamá': {
        'Panamá': [
            'Alcalde Díaz', 'Ancón', 'Bella Vista', 'Betania', 'Calidonia',
            'Chilibre', 'Curundú', 'El Chorrillo', 'Juan Díaz', 'Las Cumbres',
            'Las Mañanitas', 'Pacora', 'Pedregal', 'Pueblo Nuevo', 'San Felipe',
            'San Francisco', 'Santa Ana', 'Tocumen',
        ],
        'San Miguelito': [
            'Amelia Denis de Icaza', 'Belisario Frías', 'Belisario Porras',
            'José Domingo Espinar', 'Mateo Iturralde', 'Rufina Alfaro',
            'Victoriano Lorenzo', 'Villa del Rey',
        ],
        'Chepo': ['Chepo', 'El Llano', 'Las Margaritas', 'Tortí', 'Chepillo'],
        'Balboa': ['Balboa', 'Miraflores', 'Arraijancito'],
        'Taboga': ['Taboga', 'Otoque Occidente', 'Otoque Oriente'],
    },
    'Panamá Oeste': {
        'Arraiján': [
            'Arraiján', 'Cerro Silvestre', 'Juan Demóstenes Arosemena',
            'Nuevo Arraiján', 'Santa Clara', 'Veracruz', 'Vista Alegre',
        ],
        'La Chorrera': [
            'La Chorrera', 'Barrio Balboa', 'Barrio Colón', 'Barrio Las Minas',
            'Barrio Santa Rosa', 'El Coco', 'Herrera', 'Hurtado', 'Iturralde',
            'Los Díaz', 'Mendoza', 'Playa Leona', 'Puerto Caimito',
        ],
        'Capira': ['Capira', 'Campana', 'Cerro Viento', 'Chicá', 'La Trinidad', 'Lídice', 'Sorá'],
        'Chame': ['Chame', 'Bejuco', 'El Líbano', 'Nueva Gorgona', 'Punta Chame'],
        'San Carlos': ['San Carlos', 'El Valle', 'Gorgona', 'La Laguna', 'Las Uvas', 'San José'],
        'Bejuco': ['Bejuco', 'Santa Rita'],
    },
    'Colón': {
        'Colón': [
            'Barrio Norte', 'Barrio Sur', 'Buena Vista', 'Cativá', 'Cristóbal',
            'Escobal', 'Frijoles', 'Gatún', 'Limón', 'Nueva Providencia',
            'Paraíso', 'Puerto Pilón', 'Salamanca',
        ],
        'Portobelo': ['Portobelo', 'Garrote', 'Nombre de Dios', 'Santa Isabel'],
        'Chagres': ['Chagres', 'Nuevo Chagres', 'Palmas Bellas', 'Piña'],
        'Donoso': ['Donoso', 'Coclé del Norte', 'El Guásimo', 'El Palmar', 'Río Indio'],
    },
    'Chiriquí': {
        'David': [
            'David', 'Guácimo', 'Las Lomas', 'Pedregal', 'San Carlos',
            'San Cristóbal', 'San Pablo Nuevo', 'San Pablo Viejo',
        ],
        'Boquete': ['Bajo Boquete', 'Alto Boquete', 'Caldera', 'Cochea', 'Jaramillo', 'Los Naranjos', 'Palmira'],
        'Bugaba': ['Bugaba', 'Cerro Punta', 'Paso Canoa', 'Potrerillos', 'Santa Marta'],
        'Barú': ['Puerto Armuelles', 'Limones', 'Progreso'],
    },
    'Coclé': {
        'Penonomé': ['Penonomé', 'Cañaveral', 'Chiguirí Arriba', 'El Caño', 'Farallón', 'Río Grande'],
        'Aguadulce': ['Aguadulce', 'El Roble', 'Pocrí', 'Punta Gorda'],
        'Antón': ['Antón', 'El Valle de Antón', 'Río Hato'],
    },
    'Herrera': {
        'Chitré': ['Chitré', 'La Arena', 'Llano Bonito', 'Monagrillo', 'San Juan Bautista'],
        'Las Minas': ['Las Minas', 'Quebro', 'Tulú'],
        'Ocú': ['Ocú', 'El Cocla', 'La Yeguada', 'Los Llanos'],
        'Santa María': ['Santa María', 'La Palma', 'Los Cerros de Paja'],
    },
    'Los Santos': {
        'Las Tablas': ['Las Tablas', 'El Carate', 'La Palma', 'La Tiza', 'Pedasí', 'Pocrí', 'Oria Arriba'],
        'Los Santos': ['Los Santos', 'Guararé', 'La Colorada', 'La Espiga', 'Macaracas', 'Tonosí'],
    },
    'Veraguas': {
        'Santiago': ['Santiago', 'Canto del Llano', 'Carlos Santana Ávila', 'Edwin Fábrega', 'La Colorada', 'La Peña', 'La Raya de Santa María', 'Los Algarrobos', 'Ponuga', 'San Pedro del Espino'],
        'Soná': ['Soná', 'Bahía Honda', 'Calidonia', 'Cativá (Veraguas)', 'El Marañón', 'Guarumal', 'Río de Jesús'],
    },
};

export const METRO_STATIONS = {
    'Línea 1': [
        'Albrook', '5 de Mayo', 'Santo Tomás', 'Lotería',
        'Iglesia del Carmen', 'Vía Argentina', 'Fernández de Córdoba',
        'El Ingenio', '12 de Octubre', 'San Miguelito',
        'Pan de Azúcar', 'Los Andes', 'San Isidro', 'Villa Zaíta',
    ],
    'Línea 2': [
        'San Miguelito', 'Paraíso', 'Cincuentenario', 'Villa Lucre',
        'El Crisol', 'Brisas del Golf', 'Cerro Viento', 'San Antonio',
        'Pedregal', 'Don Bosco', 'Corredor Sur', 'Las Mañanitas',
        'Hospital del Este', 'Altos de Tocumen', '24 de Diciembre', 'Nuevo Tocumen',
    ],
};

export const DELIVERY_TYPE_LABELS = {
    gratis: 'Gratis',
    metro:  'Metro',
    zona:   'Zona',
};

export const ZONA_LEVEL_LABELS = {
    provincia:     'Provincia',
    distrito:      'Distrito',
    corregimiento: 'Corregimiento',
};

// Kept for backward compatibility
export const ZONE_TYPE_LABELS = {
    free:     'Gratis',
    province: 'Provincia',
    district: 'Distrito',
    metro:    'Metro',
    ...DELIVERY_TYPE_LABELS,
};

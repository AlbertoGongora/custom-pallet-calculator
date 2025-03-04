📦 Custom Pallet Calculator
🚀 Descripción

Custom Pallet Calculator es una aplicación diseñada para optimizar la distribución de productos en pallets dentro de un almacén. Facilita la gestión de lotes y la correcta asignación de cajas en cada pallet, asegurando una distribución eficiente y precisa según la capacidad seleccionada (12 o 16 cajas por pallet).
✨ Características

    📂 Carga de archivos Excel y Packing List (PDF/Imagen)

    📊 Procesamiento y optimización de pallets basado en las reglas de almacenamiento

    🖨️ Opción de imprimir y generar un PDF con el resultado final

    🔄 Reiniciar el proceso para un nuevo cálculo

📥 Instalación

Sigue estos pasos para ejecutar el proyecto localmente:
1️⃣ Clonar el repositorio
 git clone https://github.com/AlbertoGongora/custom-pallet-calculator.git
 cd custom-pallet-calculator
2️⃣ Instalar dependencias
 npm install
3️⃣ Iniciar la aplicación
 npm run dev

Esto abrirá la aplicación en tu navegador en http://localhost:5173/ (Vite por defecto).
📌 Uso de la Aplicación

    Seleccionar el tamaño del pallet (12 o 16 cajas).

    Subir los archivos:

        Un archivo Excel con los datos base de productos y lotes.

        Un archivo Packing List (Excel/PDF/Imagen) con la información real de los pallets.

    Procesar y visualizar los resultados:

        Se mostrará una tabla con la optimización de los pallets.

        Se indicarán los pallets añadidos, cajas movidas y la reorganización de productos.

    Descargar en PDF o imprimir el resultado.

    Nuevo pedido: Se puede reiniciar el proceso para calcular una nueva optimización.

📂 Estructura del Proyecto
/custom-pallet-calculator
│── /src
│   │── /components
│   │   │── FileUploader.tsx  # Carga de archivos
│   │   │── ResultsTable.tsx  # Tabla con los resultados
│   │── /processing
│   │   │── excelProcessor.ts # Procesamiento del Excel
│   │   │── packingListProcessor.ts # Procesamiento del Packing List
│   │── /services
│   │   │── optimizationService.ts # Optimización de pallets
│   │── App.tsx  # Componente principal
│   └── main.tsx  # Punto de entrada
│── package.json  # Dependencias del proyecto
│── README.md  # Documentación
🛠️ Tecnologías Utilizadas

    React + TypeScript ⚛️

    Vite 🚀 (para desarrollo rápido)

    xlsx 📊 (para leer archivos Excel)

    pdfjs-dist + tesseract.js 📄 (para procesar PDF e imágenes)

    html2canvas + jsPDF 🖨️ (para generar reportes en PDF)

🏗️ Contribución

Si quieres contribuir al proyecto:

    Haz un fork del repositorio 🍴

    Crea una nueva rama con tu mejora git checkout -b feature-nueva-funcion

    Realiza tus cambios y haz un commit git commit -m "Descripción del cambio"

    Sube tu rama git push origin feature-nueva-funcion

    Abre un pull request ✅

📜 Licencia

Este proyecto está bajo la licencia MIT. Puedes usarlo, modificarlo y distribuirlo libremente.

📌 Desarrollado por AlbertoGongora 🎯



import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

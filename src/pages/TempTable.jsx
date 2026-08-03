export default function Media() {
  return (
    <main className="container">
      <h1>Таблица: проблема с никами и регистрациями в клане</h1>
      <div className="card">
      <div id="sheet-table"></div>
      
      <script>
        const iframe = document.createElement('iframe');
      
        iframe.src = 'https://script.google.com/macros/s/AKfycbw-bJIHOhETs5EGf5IiyATfH9Bje0tjttDUqwh6EtQAVTEjrS4cJvI0ERAeRwdxOVkGCQ/exec?refresh=' + Date.now();
        iframe.style.width = '100%';
        iframe.style.height = '900px';
        iframe.style.border = '0';
      
        document.getElementById('sheet-table').appendChild(iframe);
      </script>
	  </div>
    </main>
  );
}

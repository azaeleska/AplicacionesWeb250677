/* =========================================================
   MecaGest - script.js
   ========================================================= */

/* ---------- Funcionalidad 1: Hola mundo ----------
   console.log escribe en la consola de depuración
   (F12 > pestaña "Consola"). */
console.log("Hola mundo");


/* El <script> está en el <head>, o sea que se carga ANTES que el
   formulario. Por eso esperamos al evento DOMContentLoaded, que
   avisa cuando ya existe todo el HTML. */
document.addEventListener("DOMContentLoaded", function () {

    /* ---------- Funcionalidad 2: Validar mayoría de edad ---------- */

    // 1. Tomamos el campo de fecha por su id
    const campoFecha = document.getElementById("fechaNacimiento");

    // 2. Creamos un <p> donde vamos a mostrar el mensaje
    //    y lo ponemos justo después del campo de fecha
    const mensaje = document.createElement("p");
    mensaje.id = "mensajeEdad";
    campoFecha.after(mensaje);

    // 3. Cada vez que el usuario cambie la fecha, revisamos la edad
    campoFecha.addEventListener("change", function () {

        // Si borró la fecha, quitamos el mensaje
        if (campoFecha.value === "") {
            mensaje.textContent = "";
            mensaje.className = "";
            return;
        }

        // El valor llega como texto "aaaa-mm-dd"; lo separamos
        const partes = campoFecha.value.split("-");
        const anioNac = Number(partes[0]);
        const mesNac = Number(partes[1]);
        const diaNac = Number(partes[2]);

        // Fecha de hoy (getMonth empieza en 0, por eso el + 1)
        const hoy = new Date();
        const anioHoy = hoy.getFullYear();
        const mesHoy = hoy.getMonth() + 1;
        const diaHoy = hoy.getDate();

        // Restamos los años...
        let edad = anioHoy - anioNac;

        // ...y si este año todavía no llega su cumpleaños, le quitamos uno
        if (mesHoy < mesNac || (mesHoy === mesNac && diaHoy < diaNac)) {
            edad = edad - 1;
        }

        // 4. Pintamos el mensaje según la edad
        if (edad < 0) {
            mensaje.textContent = "La fecha de nacimiento no puede ser en el futuro.";
            mensaje.className = "menor";
        } else if (edad >= 18) {
            mensaje.textContent = "Eres mayor de edad (" + edad + " años).";
            mensaje.className = "mayor";
        } else {
            mensaje.textContent = "Eres menor de edad (" + edad + " años).";
            mensaje.className = "menor";
        }
    });


    /* ---------- Funcionalidad 3: Wizard (formulario por pasos) ---------- */

    const formulario = document.getElementById("formRegistro");
    const paneles = document.querySelectorAll(".wizard-panel"); // los 5 fieldset
    const pasos = document.querySelectorAll(".paso");           // los 5 círculos
    const btnAnterior = document.getElementById("btnAnterior");
    const btnSiguiente = document.getElementById("btnSiguiente");

    // En qué paso vamos (empieza en 0 porque las listas cuentan desde 0)
    let pasoActual = 0;

    // Muestra el paso indicado y actualiza la barra y los botones
    function mostrarPaso(numero) {
        pasoActual = numero;

        // Solo el panel actual lleva la clase "activo"
        paneles.forEach(function (panel, i) {
            panel.classList.toggle("activo", i === numero);
        });

        // Los círculos: antes del actual = completo, el actual = activo
        pasos.forEach(function (paso, i) {
            paso.classList.toggle("completo", i < numero);
            paso.classList.toggle("activo", i === numero);
        });

        // En el primer paso no hay "Anterior"; en el último no hay "Siguiente"
        btnAnterior.classList.toggle("oculto", numero === 0);
        btnSiguiente.classList.toggle("oculto", numero === paneles.length - 1);

        // Al llegar al último paso armamos el resumen
        if (numero === paneles.length - 1) {
            llenarResumen();
        }
    }

    // Revisa que los campos obligatorios del paso actual estén bien
    function pasoValido() {
        const campos = paneles[pasoActual].querySelectorAll("input, select, textarea");

        for (const campo of campos) {
            // checkValidity() revisa required, type="email", etc.
            if (!campo.checkValidity()) {
                campo.classList.add("invalido");
                campo.reportValidity(); // muestra el globito de error del navegador
                return false;
            }
            campo.classList.remove("invalido");
        }
        return true;
    }

    // Botón Siguiente: solo avanza si el paso está bien
    btnSiguiente.addEventListener("click", function () {
        if (pasoValido()) {
            mostrarPaso(pasoActual + 1);
        }
    });

    // Botón Anterior: regresa sin validar
    btnAnterior.addEventListener("click", function () {
        mostrarPaso(pasoActual - 1);
    });

    // Se puede dar clic en un círculo verde para regresar a ese paso
    pasos.forEach(function (paso, i) {
        paso.addEventListener("click", function () {
            if (i < pasoActual) {
                mostrarPaso(i);
            }
        });
    });

    // Al escribir, quitamos el borde rojo del campo
    formulario.addEventListener("input", function (evento) {
        evento.target.classList.remove("invalido");
    });

    // Las contraseñas deben coincidir
    const contrasena = document.getElementById("contrasena");
    const confirmar = document.getElementById("confirmarContrasena");

    function revisarContrasenas() {
        if (confirmar.value !== "" && confirmar.value !== contrasena.value) {
            // setCustomValidity hace que el campo cuente como inválido
            confirmar.setCustomValidity("Las contraseñas no coinciden.");
        } else {
            confirmar.setCustomValidity("");
        }
    }

    contrasena.addEventListener("input", revisarContrasenas);
    confirmar.addEventListener("input", revisarContrasenas);

    // Muestra en el último paso un resumen de lo que escribió
    function llenarResumen() {
        const nombre = document.getElementById("nombre").value + " " +
                       document.getElementById("apPaterno").value + " " +
                       document.getElementById("apMaterno").value;

        const datos = [
            ["Nombre", nombre],
            ["Nacimiento", campoFecha.value],
            ["Correo", document.getElementById("email").value],
            ["Usuario", document.getElementById("usuario").value],
            ["Ciudad", document.getElementById("ciudad").value || "—"]
        ];

        const lista = document.getElementById("resumen");
        lista.innerHTML = ""; // vaciamos la lista

        datos.forEach(function (dato) {
            const li = document.createElement("li");
            const titulo = document.createElement("strong");
            titulo.textContent = dato[0] + ":";
            li.append(titulo, " " + dato[1]);
            lista.append(li);
        });
    }

    // Al limpiar el formulario regresamos al paso 1
    formulario.addEventListener("reset", function () {
        mensaje.textContent = "";
        mensaje.className = "";
        mostrarPaso(0);
    });

    /* ---------- Funcionalidad 4: Selección de ubicación ----------
       Leemos el catálogo assets/data/domicilios.json y con él
       llenamos las listas de País, Estado y Ciudad. El usuario
       también puede escribir a mano si su dato no aparece. */

    const campoPais = document.getElementById("pais");
    const campoEstado = document.getElementById("estado");
    const campoCiudad = document.getElementById("ciudad");
    const campoCP = document.getElementById("codigoPostal");
    const campoColonia = document.getElementById("colonia");

    // Aquí guardamos el catálogo cuando termine de cargar
    let catalogo = null;

    // Llena un <datalist> con una lista de textos
    function llenarLista(idLista, opciones) {
        const lista = document.getElementById(idLista);
        lista.innerHTML = ""; // primero la vaciamos
        opciones.forEach(function (texto) {
            const opcion = document.createElement("option");
            opcion.value = texto;
            lista.append(opcion);
        });
    }

    // fetch pide el archivo; .json() convierte el texto en un objeto
    fetch("assets/data/domicilios.json")
        .then(function (respuesta) {
            return respuesta.json();
        })
        .then(function (datos) {
            catalogo = datos;
            llenarLista("listaPaises", catalogo.paises);
        })
        .catch(function () {
            // Si no carga (por ejemplo, abriendo el HTML sin Live Server),
            // los campos siguen funcionando para escribir a mano
            console.log("No se pudo cargar domicilios.json");
        });

    // Al elegir país: si es México, ofrecemos los 32 estados
    campoPais.addEventListener("change", function () {
        if (!catalogo) return;

        if (campoPais.value === "México") {
            llenarLista("listaEstados", catalogo.estadosMexico);
        } else {
            llenarLista("listaEstados", []);
        }

        // Si cambió el país, lo que había abajo ya no sirve
        campoEstado.value = "";
        campoCiudad.value = "";
        campoCP.value = "";
        campoColonia.value = "";
        llenarLista("listaCiudades", []);
    });

    // Al elegir estado: ofrecemos solo las ciudades de ese estado
    campoEstado.addEventListener("change", function () {
        if (!catalogo) return;

        // filter se queda solo con los ejemplos del estado elegido
        const deEseEstado = catalogo.ejemplosMexico.filter(function (lugar) {
            return lugar.estado === campoEstado.value;
        });

        // map saca solo el nombre de cada ciudad
        const ciudades = deEseEstado.map(function (lugar) {
            return lugar.ciudad;
        });

        llenarLista("listaCiudades", ciudades);
        campoCiudad.value = "";
        campoCP.value = "";
        campoColonia.value = "";
    });

    // Al elegir ciudad: llenamos solos el código postal y la colonia
    campoCiudad.addEventListener("change", function () {
        if (!catalogo) return;

        // find regresa el primer lugar que coincida (o undefined)
        const lugar = catalogo.ejemplosMexico.find(function (l) {
            return l.estado === campoEstado.value && l.ciudad === campoCiudad.value;
        });

        if (lugar) {
            campoCP.value = lugar.cp;
            campoColonia.value = lugar.colonia;
        }
    });

    // Al revés: si escribe un código postal conocido, llenamos lo demás
    campoCP.addEventListener("input", function () {
        if (!catalogo || campoCP.value.length !== 5) return;

        const lugar = catalogo.ejemplosMexico.find(function (l) {
            return l.cp === campoCP.value;
        });

        if (lugar) {
            campoPais.value = "México";
            campoEstado.value = lugar.estado;
            campoCiudad.value = lugar.ciudad;
            campoColonia.value = lugar.colonia;
            llenarLista("listaEstados", catalogo.estadosMexico);
        }
    });

    // Arrancamos en el paso 1
    mostrarPaso(0);
});

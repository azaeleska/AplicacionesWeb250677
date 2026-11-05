// MecaGest - pruebas.js

console.log("Hola mundo");



document.addEventListener("DOMContentLoaded", function () {

    const campoFecha = document.getElementById("fechaNac");


    const mensaje = document.createElement("p");
    mensaje.id = "mensajeEdad";
    campoFecha.after(mensaje);

    campoFecha.addEventListener("change", function () {

        // Si borró la fecha, quitamos el mensaje
        if (campoFecha.value === "") {
            mensaje.textContent = "";
            mensaje.className = "";
            return;
        }

        const partes = campoFecha.value.split("-");
        const anioNac = Number(partes[0]);
        const mesNac = Number(partes[1]);
        const diaNac = Number(partes[2]);

        const hoy = new Date();
        const anioHoy = hoy.getFullYear();
        const mesHoy = hoy.getMonth() + 1;
        const diaHoy = hoy.getDate();

        let edad = anioHoy - anioNac;

        if (mesHoy < mesNac || (mesHoy === mesNac && diaHoy < diaNac)) {
            edad = edad - 1;
        }

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
});



/* =========================================================
   Wizard (asistente por pasos) del formulario de registro
   ---------------------------------------------------------
   - Cada <fieldset class="step"> es un paso.
   - Los indicadores de arriba se generan solos con el
     atributo data-title de cada paso.
   - Antes de avanzar se validan los campos obligatorios
     del paso actual y se muestra el mensaje junto al campo.
   - Al regresar no se pierde nada: los pasos sólo se
     ocultan, nunca se borran.
   ========================================================= */
document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById("registroForm");
    if (!form) return;

    const steps = Array.from(form.querySelectorAll(".step"));
    const stepper = document.getElementById("stepper");
    const progress = document.getElementById("progress");
    const progressFill = document.getElementById("progressFill");
    const progressTrack = progress.querySelector("[role='progressbar']");
    const progressText = document.getElementById("progressText");
    const btnPrev = document.getElementById("btnPrev");
    const btnNext = document.getElementById("btnNext");
    const btnSubmit = document.getElementById("btnSubmit");
    const terminos = document.getElementById("terminos");
    const successPanel = document.getElementById("successPanel");
    const btnRestart = document.getElementById("btnRestart");

    let actual = 0;                 // índice del paso visible
    const completados = new Set();  // pasos ya validados

    // Activa el modo wizard (sin JS se ven todos los campos)
    form.classList.add("is-wizard");
    progress.hidden = false;

    /* ---------- Mensajes de error ---------- */
    const MENSAJES = {
        valueMissing: "Este campo es obligatorio.",
        typeMismatchEmail: "Escriba un correo válido, por ejemplo nombre@dominio.com.",
        typeMismatchUrl: "Escriba una dirección completa que empiece con https://",
        rangeOverflow: "La fecha no puede ser posterior a hoy."
    };

    // Campos que se validan (todo lo que el usuario puede llenar)
    function camposDe(paso) {
        return Array.from(paso.querySelectorAll("input, select, textarea"))
            .filter(function (c) {
                return !["submit", "reset", "button", "hidden"].includes(c.type);
            });
    }

    // Crea un <p> de error debajo de cada campo y lo enlaza para lectores de pantalla
    steps.forEach(function (paso) {
        camposDe(paso).forEach(function (campo) {
            if (campo.type === "checkbox") return;
            const error = document.createElement("p");
            error.className = "field-error";
            error.id = "err-" + campo.id;
            const contenedor = campo.closest(".field") || campo.parentElement;
            contenedor.appendChild(error);
            const prev = campo.getAttribute("aria-describedby");
            campo.setAttribute("aria-describedby", (prev ? prev + " " : "") + error.id);
        });
    });

    // La fecha de nacimiento no puede ser futura
    const campoFecha = document.getElementById("fechaNac");
    campoFecha.max = new Date().toISOString().split("T")[0];

    /* ---------- Validación de un campo ---------- */
    function validarCampo(campo) {
        if (campo.type === "checkbox") return true;

        // Regla extra: las contraseñas deben coincidir
        if (campo.id === "confirmarPassword") {
            const pass = document.getElementById("password").value;
            campo.setCustomValidity(campo.value && campo.value !== pass
                ? "Las contraseñas no coinciden." : "");
        }

        const v = campo.validity;
        let texto = "";
        if (!v.valid) {
            if (v.valueMissing) texto = MENSAJES.valueMissing;
            else if (v.typeMismatch && campo.type === "email") texto = MENSAJES.typeMismatchEmail;
            else if (v.typeMismatch && campo.type === "url") texto = MENSAJES.typeMismatchUrl;
            // Para la fecha futura ya avisa el mensaje de edad, no lo repetimos
            else if (v.rangeOverflow && campo.id === "fechaNac") texto = "";
            else if (v.customError) texto = campo.validationMessage;
            else texto = campo.validationMessage;
        }

        const error = document.getElementById("err-" + campo.id);
        if (error) error.textContent = texto;

        const contenedor = campo.closest(".field");
        const vacio = campo.value === "" && !campo.required;
        if (contenedor) {
            contenedor.classList.toggle("is-invalid", !v.valid);
            contenedor.classList.toggle("is-valid", v.valid && !vacio);
        }
        campo.setAttribute("aria-invalid", String(!v.valid));
        return v.valid;
    }

    /* ---------- Validación de un paso completo ---------- */
    function validarPaso(i) {
        let primero = null;
        camposDe(steps[i]).forEach(function (campo) {
            if (!validarCampo(campo) && !primero) primero = campo;
        });
        if (primero) {
            primero.focus();
            return false;
        }
        completados.add(i);
        return true;
    }

    /* ---------- Indicadores de pasos ---------- */
    const indicadores = steps.map(function (paso, i) {
        const li = document.createElement("li");
        li.className = "stepper__item";
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "stepper__btn";
        btn.innerHTML =
            '<span class="stepper__num" aria-hidden="true">' + (i + 1) + "</span>" +
            '<span class="stepper__label">' + paso.dataset.title + "</span>";
        btn.addEventListener("click", function () { irA(i); });
        li.appendChild(btn);
        stepper.appendChild(li);
        return li;
    });

    /* ---------- Mostrar un paso ---------- */
    function mostrar(i, enfocar) {
        actual = i;
        const total = steps.length;

        steps.forEach(function (paso, k) { paso.hidden = k !== i; });

        indicadores.forEach(function (li, k) {
            const btn = li.querySelector("button");
            const hecho = completados.has(k) && k !== i;
            li.classList.toggle("is-current", k === i);
            li.classList.toggle("is-complete", hecho);
            btn.querySelector(".stepper__num").textContent = hecho ? "✓" : String(k + 1);
            if (k === i) btn.setAttribute("aria-current", "step");
            else btn.removeAttribute("aria-current");
            btn.setAttribute("aria-label",
                "Paso " + (k + 1) + ": " + steps[k].dataset.title + (hecho ? " (completado)" : ""));
        });

        // La barra avanza según los pasos completados
        const pct = Math.round((completados.size / total) * 100);
        progressFill.style.width = Math.max(pct, 4) + "%";
        progressTrack.setAttribute("aria-valuenow", String(pct));
        progressText.textContent = "Paso " + (i + 1) + " de " + total + " · " +
            steps[i].dataset.title + " — " + pct + "% completado";

        const ultimo = i === total - 1;
        btnPrev.hidden = i === 0;
        btnNext.hidden = ultimo;
        btnSubmit.hidden = !ultimo;

        if (enfocar) steps[i].focus({ preventScroll: true });
        if (enfocar) form.closest(".wizard").scrollIntoView({ behavior: "smooth", block: "start" });
    }

    /* ---------- Ir a un paso (validando los anteriores si se avanza) ---------- */
    function irA(destino) {
        if (destino === actual) return;
        if (destino < actual) { mostrar(destino, true); return; }
        for (let k = actual; k < destino; k++) {
            if (k !== actual) mostrar(k, false);
            if (!validarPaso(k)) return;   // se queda en el paso con errores
        }
        mostrar(destino, true);
    }

    btnNext.addEventListener("click", function () { irA(actual + 1); });
    btnPrev.addEventListener("click", function () { irA(actual - 1); });

    // Validación en vivo: si un campo ya mostró error, se revisa mientras escribe
    form.addEventListener("input", function (e) {
        const c = e.target.closest(".field");
        if (c && (c.classList.contains("is-invalid") || c.classList.contains("is-valid"))) {
            validarCampo(e.target);
        }
        if (e.target.id === "password") {
            const conf = document.getElementById("confirmarPassword");
            if (conf.value) validarCampo(conf);
        }
    });
    // Al salir de un campo: si está bien se marca en verde; los errores
    // nuevos se muestran al pulsar Continuar (así la página no "salta").
    form.addEventListener("change", function (e) {
        const campo = e.target;
        if (!campo.matches("input, select") || campo.type === "checkbox") return;
        if (campo.id === "confirmarPassword") {
            campo.setCustomValidity(campo.value !== document.getElementById("password").value
                ? "Las contraseñas no coinciden." : "");
        }
        const c = campo.closest(".field");
        const marcado = c && (c.classList.contains("is-invalid") || c.classList.contains("is-valid"));
        if (marcado || (campo.value !== "" && campo.checkValidity())) validarCampo(campo);
    });

    // El botón Enviar sólo se habilita al aceptar los términos
    terminos.addEventListener("change", function () {
        btnSubmit.disabled = !terminos.checked;
    });

    // Enter en un paso intermedio = Continuar (no envía)
    form.addEventListener("keydown", function (e) {
        const t = e.target;
        if (e.key !== "Enter" || t.tagName === "TEXTAREA" || t.tagName === "BUTTON") return;
        if (t.type === "submit" || t.type === "reset" || t.type === "file") return;
        if (actual < steps.length - 1) {
            e.preventDefault();
            irA(actual + 1);
        }
    });

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (actual < steps.length - 1) { irA(actual + 1); return; }

        // Último paso: validar todo antes de enviar
        for (let k = 0; k < steps.length; k++) {
            mostrar(k, false);
            if (!validarPaso(k)) return;
        }
        mostrar(steps.length - 1, false);
        if (!terminos.checked) { terminos.focus(); return; }

        // Aquí se conectará la petición a la base de datos
        completados.add(steps.length - 1);
        mostrar(actual, false);
        form.hidden = true;
        stepper.hidden = true;
        progressText.textContent = "Registro completado — 100%";
        successPanel.hidden = false;
        successPanel.focus();
    });

    // Limpiar: borra datos, estados y vuelve al paso 1
    form.addEventListener("reset", function () {
        setTimeout(function () {
            completados.clear();
            form.querySelectorAll(".field").forEach(function (f) {
                f.classList.remove("is-invalid", "is-valid");
            });
            form.querySelectorAll(".field-error").forEach(function (p) { p.textContent = ""; });
            form.querySelectorAll("[aria-invalid]").forEach(function (c) { c.removeAttribute("aria-invalid"); });
            const msgEdad = document.getElementById("mensajeEdad");
            if (msgEdad) { msgEdad.textContent = ""; msgEdad.className = ""; }
            btnSubmit.disabled = true;
            mostrar(0, true);
        }, 0);
    });

    btnRestart.addEventListener("click", function () {
        successPanel.hidden = true;
        form.hidden = false;
        stepper.hidden = false;
        form.reset();
    });

    mostrar(0, false);
});

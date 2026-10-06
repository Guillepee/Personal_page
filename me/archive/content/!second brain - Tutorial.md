---
title: Second brain sincronizado y editable con Claude Code/Codex
description: Arquitectura reproducible sobre Syncthing, con una única fuente de verdad replicada entre varios dispositivos y un peer permanente.
date: 2026-10-05
slug: second-brain-syncthing
tags:
  - Organizacion
  - IA
  - Descentralizado
type: note
lang: es
published: true
# source: https://example.com/articulo-original
nav_title: Contenidos
footer: Documentación operativa de un second brain personal, pensada para replicarse.
---


Guía para montar un **second brain**: una base de conocimiento personal que persiste, se consulta y crece con el tiempo, en lugar de dispersarse entre notas sueltas y conversaciones que se pierden. El objetivo no es sincronizar una carpeta, sino sostener ese conocimiento con **una única fuente de verdad**, replicada en tiempo real entre varias PCs, un teléfono Android y un peer siempre encendido que actúa como hub, utilizando **únicamente Syncthing** como motor de sincronización.

El soporte es un vault de Obsidian. Conviene distinguir dos capas: el **vault** es el sustrato —la carpeta de archivos markdown que Obsidian abre y Syncthing replica—, mientras que el **second brain** es lo que ese contenido constituye, con su diario, su wiki, sus procedimientos y las relaciones entre ellos. Las decisiones de arquitectura se justifican por el segundo, no por el primero: una carpeta admite soluciones que una base de conocimiento no tolera, como la pérdida silenciosa de una nota o la divergencia entre dispositivos.

Claude Code (o Codex) se ejecuta en una de las máquinas como un editor más del vault, y puede exponerse además para consultar el second brain desde el teléfono.

---

# Arquitectura final

- **Motor de sincronización:** Syncthing, exclusivamente. Sin Git, sin Drive y sin VPN en el camino de datos.
- **Seguridad:** Syncthing endurecido — solo se aceptan los Device ID propios; el resto es configuración.
- **Agente de IA:** se ejecuta dentro de un contenedor (Podman rootless) con un volumen sobre el vault del host. Un dispositivo Android puede correr además un CLI de IA en Termux contra su copia local del vault, para responder consultas remotas.
- **Alcance típico:** sincronización entre peers en la **misma LAN**. Una VPN (Tailscale, WireGuard) queda como canal de administración y acceso remoto, no como requisito de la sincronización.
- **Git:** opcional, útil para versionar operaciones puntuales (por ejemplo un cron que arma un resumen diario). No interviene en la sincronización entre dispositivos.

---

# Por qué se descartó GitHub

GitHub y el plugin Obsidian Git no son herramientas deficientes: son las herramientas equivocadas para este caso.

1. **No es sincronización en vivo, sino versionado manual.** El flujo `commit → push → pull` exige una acción deliberada en cada dispositivo, que además debe recordar actualizar antes de editar. En cuanto un dispositivo edita sin haber actualizado, aparece un conflicto de merge en markdown.
2. **El plugin de Git en Android resulta frágil.** Al iniciar la aplicación, en ocasiones detecta cambios sin haber completado la actualización inicial y **sobrescribe el commit previo**, con la consiguiente pérdida de información.
3. **No existe propagación automática entre peers.** Cuando cualquier dispositivo modifica un archivo, el resto debe actualizar manualmente.

**Conclusión:** GitHub es una fuente de verdad centralizada con sincronización manual y discreta. El requisito acá es **sincronización a nivel de sistema de archivos, viva y automática**, que es precisamente la definición de Syncthing.

---

# Por qué no una VPN en la capa de sincronización

Syncthing no la necesita: cifra el tráfico extremo a extremo con TLS 1.3 y autentica cada peer mediante su Device ID (el hash de su clave pública). Un dispositivo no aceptado explícitamente no puede sincronizar nada, aunque conozca la dirección IP. Sumar una malla VPN propia solo para transporte agrega una pieza más para instalar y mantener, sin resolver nada que Syncthing no resuelva ya.

> **Contrapartida:** sin una VPN de por medio, dos peers en **redes distintas** solo se encuentran si se habilita el discovery global de Syncthing (ver la sección siguiente), o si se agrega una malla propia con direcciones estáticas. Es la única disyuntiva real que determina si un dispositivo remoto sincroniza fuera de la red local.

---

# Arquitectura

```
                    ┌──────────────────────┐
                    │   Hub 24/7           │
                    │   - Syncthing        │
                    │   copia completa     │
                    │   del vault          │
                    └──────────┬───────────┘
                               │  (malla P2P cifrada — Syncthing TLS)
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
┌────────┴────────┐  ┌─────────┴────────┐  ┌─────────┴────────┐
│  PC principal   │  │  Otras PCs       │  │  Móvil Android   │
│  - Syncthing    │  │  - Syncthing     │  │  - Termux        │
│  - Obsidian     │  │  - Obsidian      │  │  - Syncthing     │
│  - Claude Code  │  │                  │  │  - Obsidian      │
│    (contenedor) │  │                  │  │  - CLI de IA     │
│  edita el vault │  │                  │  │  consulta vault  │
└─────────────────┘  └──────────────────┘  └──────────────────┘
```

- **Hub 24/7** — peer permanentemente encendido. Su función es garantizar que siempre haya al menos un peer en línea, ya que Syncthing requiere dos peers activos simultáneamente para sincronizar. Mantiene una copia completa del vault y propaga como cualquier otro nodo.
- **PC principal** — peer donde se ejecuta el agente de IA dentro de un contenedor. Obsidian edita el vault en la misma máquina con normalidad.
- **Otras PCs** — peers completos, editan con Obsidian.
- **Móvil Android** — peer montado con Termux y Syncthing (o con Syncthing-Fork). Obsidian abre la carpeta local sincronizada. Puede correr además un CLI de IA autenticado para responder consultas.

Todos los peers operan en modo **lectura y escritura**: no hay un maestro para el uso diario. Un único dispositivo actúa como **fuente inicial** durante el primer emparejamiento —el que ya tiene el vault completo—; el resto arranca con la carpeta vacía y Syncthing la puebla.

**Por qué Syncthing y no Drive/OneDrive:** malla P2P sin nube (ningún tercero accede al contenido), *==sin costes de suscripción==*, Obsidian móvil abre una carpeta local real (que Drive no expone), y el agente de IA trabaja.

---

# Alcance: LAN o remoto

Syncthing tiene tres mecanismos para que los peers se encuentren. La combinación activa determina qué peers pueden sincronizar.

| Mecanismo | Función | Cuándo se necesita |
|---|---|---|
| **Local Discovery** | Difusión dentro de la LAN, no sale a internet. | Peers en la **misma red**. Conviene mantenerlo siempre activo. |
| **Global Discovery** | Anuncia Device ID e IP a servidores públicos de Syncthing. | Peers en **redes distintas**, sin otra malla. |
| **Relaying** | Reenvía tráfico cifrado por relays públicos si no hay conexión directa. | Alternativa cuando el NAT impide la conexión directa. |

**Dos perfiles según el caso:**

- **Perfil A — Todos los peers en la misma LAN (endurecido):** Local Discovery activo, Global Discovery y Relaying inactivos. Máxima privacidad, ninguna metadata expuesta. Limitación: los peers en otra red no conectan.
- **Perfil B — Peers remotos sin VPN:** los tres mecanismos activos. Configuración por defecto de Syncthing, sincroniza entre redes distintas sin ajustes adicionales. La única precaución de seguridad relevante es **no aceptar nunca una invitación de un Device ID ajeno** — el discovery global expone metadata (qué Device ID está en qué IP), nunca contenido, que viaja siempre cifrado.

> **Error frecuente:** desactivar Global Discovery y Relaying a la vez deja a los peers como «Desconectado», porque sin ningún mecanismo de discovery no tienen forma de encontrarse. Dentro de la LAN se resuelve con Local Discovery activo; para peers remotos sin VPN hace falta el Perfil B.

La única alternativa que combina endurecimiento total con peers remotos es sumar una malla propia (Tailscale) y declarar direcciones estáticas en cada peer, con todo el discovery desactivado.

---

# Cómo se monta

## 1 — Instalar y endurecer Syncthing

En Linux, desde los repositorios oficiales, sin scripts de terceros:

```bash
sudo apt install syncthing
systemctl --user enable --now syncthing
sudo loginctl enable-linger <usuario>   # mantiene el servicio activo tras cerrar sesión
```

En Windows, SyncTrayzor. En Android, Syncthing-Fork (de Catfriend1, vía F-Droid) o Termux + `syncthing generate` para un montaje más manual.

Endurecimiento en cada instancia (**Settings → Connections**): elegir el perfil de discovery (A o B) de forma **consistente en todos los peers**. En **Settings → GUI**: la interfaz web nunca debe escuchar en `0.0.0.0`, solo en `127.0.0.1`, y protegida con usuario y contraseña.

**Regla de seguridad fundamental:** aceptar exclusivamente los Device ID de equipos propios y nunca una invitación desconocida.

## 2 — Emparejar sin duplicar el vault

> El vault completo debe existir en un único lugar al comenzar. El resto de dispositivos recibe la carpeta **vacía**. Poner una copia en dos lados y emparejar después genera conflictos masivos (`sync-conflict-*`).

Verificar que la carpeta destino esté vacía antes de aceptar la carpeta compartida. Configurar tipo **Send & Receive**, File Watcher activo y **File Versioning → Staggered** como red de seguridad frente a borrados accidentales.

Patrones de exclusión (`.stignore`) críticos para no sincronizar ruido entre dispositivos:

```text
.git
.trash
.obsidian/workspace.json
.obsidian/workspace-mobile.json
.obsidian/cache
.DS_Store
```

Esperar a que ambos extremos indiquen **«Up to Date»**. Un estado «Desconectado» persistente suele deberse a que el otro extremo todavía no aceptó la solicitud, o a que el perfil de discovery elegido no cubre ese caso (ver sección anterior).

## 3 — El agente de IA editando el vault en contenedor rootless

Correr el agente dentro de un contenedor **Podman rootless** es lo que evita el problema típico de permisos: con rootless, el usuario `root` dentro del contenedor se mapea al **usuario propietario en el host**.

```bash
podman info --format '{{.Host.Security.Rootless}}'   # debe devolver: true
```

La consecuencia es determinante: los archivos que el agente escribe como `root` dentro del contenedor **aparecen en el host como propiedad del usuario habitual**. Syncthing y Obsidian, que corren con ese usuario, los leen sin conflictos de permisos. En una instalación *rootful* quedarían como `root:root`, con los consiguientes problemas de acceso.

```bash
podman run -it -v <ruta-vault-en-host>:/workspace:Z <imagen-con-el-agente>
```

El flujo completo: el agente edita `/workspace` dentro del contenedor, los archivos se materializan en el vault del host, el File Watcher de Syncthing los detecta y los propaga al resto de dispositivos en segundos, quedando visibles en Obsidian desde cualquier extremo.

## 4 — Consultar el vault desde el teléfono (opcional)

Un dispositivo Android ARM64 puede correr un CLI de IA por Termux contra su copia local del vault y responder preguntas sobre el contenido. Si además se quiere disparar esa consulta desde una app de mensajería, el patrón es: mensaje → bot → SSH con llave dedicada hacia el teléfono → wrapper que invoca el CLI contra el vault local → respuesta de vuelta. Cada pieza (autenticación del CLI, certificados dentro de Termux, alcance del sandbox) tiene sus propias fricciones específicas del entorno Android, que conviene resolver de forma incremental.

## 5 — Acceso remoto (opcional)

El agente de IA que corre en contenedor solo existe en la PC que lo aloja; un teléfono no lo ejecuta directamente, actúa como control remoto por SSH. Si ya existe una VPN (corporativa o propia), conviene reusarla para esto en lugar de sumar una nueva — con una salvedad: muchas VPN en topología *hub-and-spoke* bloquean el tráfico **entre clientes**, así que conviene verificar con un `ping`/`ssh` directo entre los dos dispositivos antes de dar la vía por válida. Si no responde, se justifica una malla propia dedicada solo a esto, sin tocar la sincronización.

---

# Diagnóstico rápido de un peer «Desconectado»

1. Local Discovery activo en ambos extremos (la causa más frecuente en LAN).
2. Emparejamiento mutuo: ambos extremos deben haber aceptado el Device ID del otro.
3. Device ID copiado sin errores.
4. Alcance de red: `ping` y `nc -zv <ip> 22000` **desde el host**, nunca desde dentro de un contenedor (tiene su propio namespace de red y no ve el estado real del host).
5. Cortafuegos: puerto `22000/tcp` (sincronización) y `21027/udp` (Local Discovery).
6. Aislamiento de clientes en el router/AP, habitual en redes wifi de oficina o de invitados.

---

# Costes y naturaleza del stack

| Componente | Licencia | Coste | Función |
|---|---|---|---|
| Syncthing | MPL-2.0 (open source) | Gratuito | Sincronización P2P |
| Syncthing-Fork (Android) | Open source | Gratuito | Cliente Android |
| Termux | Open source | Gratuito | SSH, Syncthing y CLI de IA en el móvil |
| Obsidian | Propietario | Gratuito (uso personal) | Editor |

El mecanismo de sincronización es íntegramente open source y sin coste. Cada dispositivo almacena una **copia completa** del vault, irrelevante para contenido de texto — solo pesa si se incorporan binarios grandes.

---

# Limitaciones conocidas

- **Copia completa por dispositivo:** no hay descarga bajo demanda como en Drive.
- **Alcance condicionado por el perfil de discovery:** sin VPN propia, no existe una combinación que dé endurecimiento total y alcance remoto automático a la vez.
- **Sin interfaz web para consultar el vault desde cualquier navegador:** el acceso requiere un dispositivo con la carpeta ya sincronizada.
- **Consumo de batería en Android** si Syncthing corre en segundo plano de forma permanente; se mitiga restringiendo la sincronización a wifi o a momentos de carga.
- **El hub no es la fuente de verdad, es un peer más.** Aunque falle su almacenamiento, el vault sigue replicado en el resto — no hay un punto único de fallo.
- **No correr dos motores de sincronización sobre el mismo vault** (por ejemplo Syncthing y otro plugin de sync simultáneamente): produce doble sincronización y conflictos.
- **Máquinas administradas por terceros:** si el host lo administra un tercero (IT corporativo, por ejemplo), vale la pena decidir explícitamente qué contenido del vault se replica hacia dispositivos personales — es una decisión de gobernanza, no técnica.

---

Esta arquitectura no depende de ninguna herramienta propietaria de sincronización ni de una cuenta en la nube: se replica con Syncthing, un contenedor rootless y un editor de markdown. Lo único específico de cada montaje es la topología de red y qué agente de IA se elige para editar y consultar el vault.

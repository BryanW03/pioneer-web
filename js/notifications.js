// ============================================================
// PIONEER PORTAL — NOTIFICACIONES POR CORREO (RESEND)
// ============================================================
// IMPORTANTE: Resend no permite llamadas directas desde el navegador
// por seguridad (CORS). Usamos un Edge Function de Supabase como proxy.
// Ver supabase-edge-function-resend.md para el setup del backend.

const PioneerNotify = {

  async sendTicketCreated(ticket) {
    const cfg = window.PIONEER_CONFIG
    if (!cfg.resend?.enabled) return

    const recipients = [ticket.created_by_email]
    if (ticket.assigned_to_email) recipients.push(ticket.assigned_to_email)

    await this._send({
      to: recipients,
      subject: `🎫 Nuevo Ticket Creado - ${ticket.ticket_num}`,
      html: this._templateCreated(ticket),
    })
  },

  async sendStatusChanged(ticket, oldStatus, newStatus, changedBy) {
    const cfg = window.PIONEER_CONFIG
    if (!cfg.resend?.enabled) return

    const recipients = [ticket.created_by_email]
    if (ticket.assigned_to_email && ticket.assigned_to_email !== changedBy.email) {
      recipients.push(ticket.assigned_to_email)
    }

    await this._send({
      to: recipients,
      subject: `🔄 Ticket ${ticket.ticket_num} actualizado: ${newStatus}`,
      html: this._templateStatusChange(ticket, oldStatus, newStatus, changedBy),
    })
  },

  async sendNewComment(ticket, comment, commenter) {
    const cfg = window.PIONEER_CONFIG
    if (!cfg.resend?.enabled) return

    const recipients = []
    if (ticket.created_by_email !== commenter.email) recipients.push(ticket.created_by_email)
    if (ticket.assigned_to_email && ticket.assigned_to_email !== commenter.email) {
      recipients.push(ticket.assigned_to_email)
    }
    if (!recipients.length) return

    await this._send({
      to: recipients,
      subject: `💬 Nuevo comentario en ${ticket.ticket_num}`,
      html: this._templateComment(ticket, comment, commenter),
    })
  },

  async sendAssigned(ticket, assignedUser, assignedBy) {
    const cfg = window.PIONEER_CONFIG
    if (!cfg.resend?.enabled) return

    await this._send({
      to: [assignedUser.email],
      subject: `📌 Ticket asignado a ti: ${ticket.ticket_num}`,
      html: this._templateAssigned(ticket, assignedUser, assignedBy),
    })
  },

  // ── Internal: send via Supabase Edge Function ──────────
  async _send({ to, subject, html }) {
    const cfg = window.PIONEER_CONFIG
    try {
      const res = await fetch(`${cfg.supabase.url}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cfg.supabase.anonKey}`,
        },
        body: JSON.stringify({ to, subject, html }),
      })
      if (!res.ok) {
        const err = await res.text()
        console.warn('[Notify] Email send failed:', err)
      }
    } catch (e) {
      console.warn('[Notify] Email send error (non-blocking):', e.message)
    }
  },

  // ── Email templates ─────────────────────────────────────
  _baseStyle: `font-family:Arial,sans-serif;max-width:560px;margin:0 auto;`,

  _header(title) {
    return `
      <div style="background:#392B6F;padding:24px 28px;border-radius:12px 12px 0 0">
        <p style="color:white;font-size:18px;font-weight:bold;margin:0">Pioneer Investment Funds</p>
        <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:4px 0 0">${title}</p>
      </div>`
  },

  _footer() {
    return `
      <div style="padding:16px 28px;background:#f4f4f6;border-radius:0 0 12px 12px;text-align:center">
        <p style="font-size:11px;color:#999;margin:0">Pioneer Investment Funds — IT Service Desk</p>
        <p style="font-size:11px;color:#bbb;margin:4px 0 0">Este es un correo automático, no responder directamente.</p>
      </div>`
  },

  _templateCreated(t) {
    return `<div style="${this._baseStyle}">
      ${this._header('Nuevo Ticket de Soporte')}
      <div style="padding:24px 28px;background:white;border:1px solid #eee;border-top:none">
        <p style="font-size:13px;color:#666">Se ha creado un nuevo ticket:</p>
        <div style="background:#EAE6F5;border-radius:10px;padding:16px;margin:16px 0">
          <p style="font-size:11px;color:#392B6F;font-weight:bold;margin:0 0 4px">#${t.ticket_num}</p>
          <p style="font-size:16px;font-weight:bold;color:#111;margin:0 0 8px">${t.asunto}</p>
          <p style="font-size:12px;color:#555;margin:0">📁 ${t.categoria} &nbsp;|&nbsp; ⚡ ${t.prioridad}</p>
        </div>
        <p style="font-size:13px;color:#333;line-height:1.6">${t.descripcion}</p>
        <p style="font-size:12px;color:#999;margin-top:16px">Creado por: ${t.created_by_name} (${t.created_by_email})</p>
      </div>
      ${this._footer()}
    </div>`
  },

  _templateStatusChange(t, oldStatus, newStatus, changedBy) {
    return `<div style="${this._baseStyle}">
      ${this._header('Actualización de Estado')}
      <div style="padding:24px 28px;background:white;border:1px solid #eee;border-top:none">
        <p style="font-size:13px;color:#666">El ticket <strong>#${t.ticket_num}</strong> cambió de estado:</p>
        <div style="background:#EAE6F5;border-radius:10px;padding:16px;margin:16px 0">
          <p style="font-size:16px;font-weight:bold;color:#111;margin:0 0 12px">${t.asunto}</p>
          <p style="font-size:13px;margin:0">
            <span style="color:#999;text-decoration:line-through">${oldStatus}</span>
            &nbsp;→&nbsp;
            <strong style="color:#392B6F">${newStatus}</strong>
          </p>
        </div>
        <p style="font-size:12px;color:#999">Actualizado por: ${changedBy.name}</p>
      </div>
      ${this._footer()}
    </div>`
  },

  _templateComment(t, comment, commenter) {
    return `<div style="${this._baseStyle}">
      ${this._header('Nuevo Comentario')}
      <div style="padding:24px 28px;background:white;border:1px solid #eee;border-top:none">
        <p style="font-size:13px;color:#666">Nuevo comentario en el ticket <strong>#${t.ticket_num}</strong>:</p>
        <p style="font-size:15px;font-weight:bold;color:#111;margin:8px 0 16px">${t.asunto}</p>
        <div style="background:#f8f8f8;border-left:3px solid #392B6F;border-radius:0 8px 8px 0;padding:14px">
          <p style="font-size:12px;font-weight:bold;color:#392B6F;margin:0 0 6px">${commenter.name}</p>
          <p style="font-size:13px;color:#333;margin:0;line-height:1.6">${comment}</p>
        </div>
      </div>
      ${this._footer()}
    </div>`
  },

  _templateAssigned(t, assignedUser, assignedBy) {
    return `<div style="${this._baseStyle}">
      ${this._header('Ticket Asignado')}
      <div style="padding:24px 28px;background:white;border:1px solid #eee;border-top:none">
        <p style="font-size:13px;color:#666">Hola ${assignedUser.name}, te han asignado un ticket:</p>
        <div style="background:#EAE6F5;border-radius:10px;padding:16px;margin:16px 0">
          <p style="font-size:11px;color:#392B6F;font-weight:bold;margin:0 0 4px">#${t.ticket_num}</p>
          <p style="font-size:16px;font-weight:bold;color:#111;margin:0 0 8px">${t.asunto}</p>
          <p style="font-size:12px;color:#555;margin:0">📁 ${t.categoria} &nbsp;|&nbsp; ⚡ ${t.prioridad}</p>
        </div>
        <p style="font-size:12px;color:#999">Asignado por: ${assignedBy.name}</p>
      </div>
      ${this._footer()}
    </div>`
  },
}

window.PioneerNotify = PioneerNotify

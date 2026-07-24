import { useEffect, useRef, useState } from 'react'
import './App.css'

const backgroundImage = '/invitation/background.png'
const graduateImage = '/invitation/graduate.png'
const foregroundImage = '/invitation/foreground-fade.png'
const rsvpEndpoint =
  import.meta.env.VITE_RSVP_ENDPOINT?.trim() ||
  'https://script.google.com/macros/s/AKfycbz4OVlI2lbxVFwTqNkt1P-FXny-luEucoFN5WBoltmQoPV5gnc3CU8qyX59lw5rDiVg/exec'

const initialForm = {
  fullName: '',
  ceremony: '',
  party: '',
  note: '',
}

function App() {
  const [isRsvpOpen, setIsRsvpOpen] = useState(false)
  const [formData, setFormData] = useState(initialForm)
  const [submitState, setSubmitState] = useState('idle')
  const [submitMessage, setSubmitMessage] = useState('')
  const triggerRef = useRef(null)

  useEffect(() => {
    if (!isRsvpOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setIsRsvpOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isRsvpOpen])

  const openRsvp = () => {
    setSubmitState('idle')
    setSubmitMessage('')
    setIsRsvpOpen(true)
  }

  const closeRsvp = () => {
    setIsRsvpOpen(false)
    triggerRef.current?.focus()
  }

  const updateField = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const submitRsvp = async (event) => {
    event.preventDefault()

    if (!rsvpEndpoint) {
      setSubmitState('error')
      setSubmitMessage(
        'Biểu mẫu chưa được kết nối nơi nhận phản hồi. Vui lòng thử lại sau.',
      )
      return
    }

    setSubmitState('submitting')
    setSubmitMessage('')

    try {
      await fetch(rsvpEndpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          ...formData,
          submittedAt: new Date().toISOString(),
        }),
      })

      setSubmitState('success')
      setSubmitMessage(
        'Cảm ơn bạn đã xác nhận.\nHẹn gặp bạn tại lễ tốt nghiệp của Bắp nhé!',
      )
      setFormData(initialForm)
    } catch {
      setSubmitState('error')
      setSubmitMessage(
        'Chưa thể gửi xác nhận. Vui lòng kiểm tra kết nối và thử lại.',
      )
    }
  }

  return (
    <main className="invitation-page">
      <section className="invitation-stage" aria-labelledby="invitation-title">
        <div
          className="background-layer"
          style={{ backgroundImage: `url("${backgroundImage}")` }}
          aria-hidden="true"
        />

        <div className="graduate-reveal" aria-hidden="true">
          <img className="graduate-photo" src={graduateImage} alt="" />
        </div>

        <img
          className="foreground-layer"
          src={foregroundImage}
          alt=""
          aria-hidden="true"
        />

        <header className="graduation-heading">
          <span className="happy-text">Happy</span>
          <h1 id="invitation-title">Graduation</h1>
        </header>

        <p className="graduate-name graduate-name-left" aria-label="Bắp">
          <span aria-hidden="true">B</span>
          <span className="accented-a" aria-hidden="true">
            A
          </span>
          <span aria-hidden="true">P</span>
        </p>
        <p className="graduate-name graduate-name-right" aria-label="Bắp">
          <span aria-hidden="true">B</span>
          <span className="accented-a" aria-hidden="true">
            A
          </span>
          <span aria-hidden="true">P</span>
        </p>

        <div className="event-details">
          <div className="event-time-row">
            <div className="event-time">
              <span>Thứ năm</span>
              <strong>06/08</strong>
            </div>
            <div className="event-time">
              <span>Vào lúc</span>
              <strong>10H30</strong>
            </div>
          </div>

          <div className="event-divider" aria-hidden="true" />

          <div className="university">
            <img
              className="university-logo"
              src="/invitation/logo-vlu-white.png"
              alt="Logo Văn Lang University"
            />
            <span>Van Lang University</span>
          </div>

          <a
            className="event-address"
            href="https://www.google.com/maps/search/?api=1&query=69%2F68%20%C4%90%E1%BA%B7ng%20Th%C3%B9y%20Tr%C3%A2m%2C%20ph%C6%B0%E1%BB%9Dng%20B%C3%ACnh%20L%E1%BB%A3i%20Trung%2C%20TP.%20HCM"
            target="_blank"
            rel="noreferrer"
          >
            69/68 Đặng Thùy Trâm, phường Bình Lợi Trung, TP. HCM
          </a>

          <div className="contact-row">
            <a href="tel:+84335434504">
              <span className="phone-icon" aria-hidden="true">
                <i className="fa-solid fa-phone" />
              </span>
              033 543 4504
            </a>
            <a href="tel:+84385407533">
              <span className="phone-icon" aria-hidden="true">
                <i className="fa-solid fa-phone" />
              </span>
              038 540 7533
            </a>
          </div>
        </div>

        <button
          ref={triggerRef}
          className="rsvp-trigger"
          type="button"
          onClick={openRsvp}
          aria-haspopup="dialog"
        >
          <span className="rsvp-trigger-seal" aria-hidden="true">
            ✓
          </span>
          Xác nhận tham dự
        </button>
      </section>

      {isRsvpOpen && (
        <div className="rsvp-backdrop" onMouseDown={closeRsvp}>
          <section
            className="rsvp-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rsvp-title"
            aria-describedby="rsvp-description"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="rsvp-heading">
              <div>
                <p className="rsvp-eyebrow">Lễ tốt nghiệp</p>
                <h2 id="rsvp-title">Bạn sẽ đến chung vui chứ?</h2>
                <p id="rsvp-description">
                  Một lời xác nhận của bạn sẽ giúp mình chuẩn bị chu đáo hơn!
                </p>
              </div>
              <button
                className="rsvp-close"
                type="button"
                onClick={closeRsvp}
                aria-label="Đóng biểu mẫu"
              >
                ×
              </button>
            </div>

            {submitState === 'success' ? (
              <div className="rsvp-success" role="status">
                <span aria-hidden="true">✓</span>
                <h3>Đã nhận phản hồi</h3>
                <p>{submitMessage}</p>
                <button type="button" onClick={closeRsvp}>
                  Hoàn tất
                </button>
              </div>
            ) : (
              <form className="rsvp-form" onSubmit={submitRsvp}>
                <label className="rsvp-field">
                  <span>
                    Họ và tên <strong aria-hidden="true">*</strong>
                  </span>
                  <input
                    name="fullName"
                    value={formData.fullName}
                    onChange={updateField}
                    autoComplete="name"
                    placeholder="Nhập họ và tên của bạn"
                    required
                    autoFocus
                  />
                </label>

                <fieldset className="rsvp-fieldset">
                  <legend>
                    Bạn có tham dự lễ tốt nghiệp không?{' '}
                    <strong aria-hidden="true">*</strong>
                  </legend>
                  <div className="rsvp-options">
                    <label>
                      <input
                        type="radio"
                        name="ceremony"
                        value="Có"
                        checked={formData.ceremony === 'Có'}
                        onChange={updateField}
                        required
                      />
                      <span>Có, mình sẽ đến</span>
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="ceremony"
                        value="Không"
                        checked={formData.ceremony === 'Không'}
                        onChange={updateField}
                        required
                      />
                      <span>Mình không thể đến</span>
                    </label>
                  </div>
                </fieldset>

                <fieldset className="rsvp-fieldset">
                  <legend>
                    Bạn có tham dự tiệc ăn mừng sau buổi lễ không?{' '}
                    <strong aria-hidden="true">*</strong>
                  </legend>
                  <div className="rsvp-options">
                    <label>
                      <input
                        type="radio"
                        name="party"
                        value="Có"
                        checked={formData.party === 'Có'}
                        onChange={updateField}
                        required
                      />
                      <span>Có, mình tham dự</span>
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="party"
                        value="Không"
                        checked={formData.party === 'Không'}
                        onChange={updateField}
                        required
                      />
                      <span>Mình không tham dự</span>
                    </label>
                  </div>
                </fieldset>

                <label className="rsvp-field">
                  <span>
                    Ghi chú
                  </span>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={updateField}
                    rows="3"
                    placeholder="Lời nhắn dành cho Bắp..."
                  />
                </label>

                {submitState === 'error' && (
                  <p className="rsvp-error" role="alert">
                    {submitMessage}
                  </p>
                )}

                <button
                  className="rsvp-submit"
                  type="submit"
                  disabled={submitState === 'submitting'}
                >
                  {submitState === 'submitting'
                    ? 'Đang gửi xác nhận...'
                    : 'Gửi xác nhận'}
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </main>
  )
}

export default App

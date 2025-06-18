import React, { useState, useEffect, useCallback } from 'react'
import cn from 'classnames'
import Layout from '../components/Layout'
import { PageMeta } from '../components/Meta'
import chooseBySlug from '../utils/chooseBySlug'
import { useStateContext } from '../utils/context/StateContext'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import Headers from '../components/Header'
import Image from 'next/image'

const ProfilePage = ({ navigationItems }) => {
  const { cosmicUser } = useStateContext()
  const [profileData, setProfileData] = useState(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [animateItems, setAnimateItems] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const infoAbout = chooseBySlug(null, 'profile')

  // Helper: Compute username from email if domain is "iiitkottayam.ac.in"
  const computeUsername = email => {
    if (!email?.endsWith('@iiitkottayam.ac.in')) return null
    const localPart = email.split('@')[0]
    const username = localPart.replace(/\d.*$/, '')
    return username.toUpperCase()
  }

  // Helper: Compute roll number from email if domain is "iiitkottayam.ac.in"
  const computeRollNumber = email => {
    if (!email?.endsWith('@iiitkottayam.ac.in')) return null
    const localPart = email.split('@')[0]
    const pattern = /^([a-z]+)(\d{2})([a-z]+)(\d+)$/i
    const match = localPart.match(pattern)
    if (!match) return null
    const [, , year, deptCode, roll] = match
    const paddedRoll = roll.padStart(4, '0')
    return `20${year}${deptCode}${paddedRoll}`
  }

  // Fetch Firestore user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (cosmicUser && cosmicUser.id) {
        try {
          setLoading(true)
          const userDocRef = doc(db, 'users', cosmicUser.id)
          const userDocSnap = await getDoc(userDocRef)
          let firestoreData = {}

          if (userDocSnap.exists()) {
            firestoreData = userDocSnap.data()
            console.log('Fetched Firestore user data:', firestoreData)
          } else {
            console.log('No user data found for UID:', cosmicUser.id)
            // Initialize with default data
            firestoreData = {
              email: cosmicUser.email || '',
              name: cosmicUser.displayName || '',
              avatar: cosmicUser.photoURL || '',
              title: 'Student',
              bio: '',
              phone: '',
              year: '',
              department: '',
              interests: [],
              social: {
                instagram: '',
                linkedin: '',
                github: '',
              },
            }
          }

          setProfileData(firestoreData)
          setEditForm(firestoreData)

          setTimeout(() => {
            setLoading(false)
            setTimeout(() => {
              setAnimateItems(true)
            }, 100)
          }, 500)
        } catch (error) {
          console.error('Error fetching user data:', error)
          setLoading(false)
        }
      }
    }
    fetchUserData()
  }, [cosmicUser])

  // Handle form input changes
  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setEditForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }))
    } else {
      setEditForm(prev => ({
        ...prev,
        [field]: value,
      }))
    }
  }

  // Handle interests array
  const handleInterestsChange = value => {
    const interests = value
      .split(',')
      .map(item => item.trim())
      .filter(item => item)
    setEditForm(prev => ({
      ...prev,
      interests,
    }))
  }

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!cosmicUser?.id) return

    try {
      setIsSaving(true)
      setErrorMessage('')

      const userDocRef = doc(db, 'users', cosmicUser.id)
      await updateDoc(userDocRef, editForm)

      setProfileData(editForm)
      setIsEditing(false)
      setSuccessMessage('Profile updated successfully!')

      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
      setErrorMessage('Failed to update profile. Please try again.')
      setTimeout(() => {
        setErrorMessage('')
      }, 3000)
    } finally {
      setIsSaving(false)
    }
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setEditForm(profileData)
    setIsEditing(false)
    setErrorMessage('')
  }

  // When tab is changed, animate items
  const handleTabChange = tab => {
    setAnimateItems(false)
    setActiveTab(tab)
    setTimeout(() => {
      setAnimateItems(true)
    }, 50)
  }

  if (loading || !profileData) {
    return (
      <Layout navigationPaths={navigationItems}>
        <PageMeta
          title="Profile | UniTrader"
          description="UniTrader is your friendly college-hood marketplace."
        />
        <Headers navigation={navigationItems} />
        <div className="section">
          <div className="container">
            <div className="loading">Loading your profile...</div>
          </div>
        </div>
      </Layout>
    )
  }

  const rollNumber = computeRollNumber(profileData.email)
  const username = computeUsername(profileData.email)

  // Render profile content
  const renderProfileContent = () => {
    return (
      <div className={`profileContent ${animateItems ? 'animate' : ''}`}>
        {isEditing ? (
          <div className="editForm">
            <div className="formGrid">
              <div className="formGroup">
                <label>Display Name</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={e => handleInputChange('name', e.target.value)}
                  placeholder="Enter your display name"
                />
              </div>

              <div className="formGroup">
                <label>Title</label>
                <input
                  type="text"
                  value={editForm.title || ''}
                  onChange={e => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Computer Science Student"
                />
              </div>

              <div className="formGroup">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={editForm.phone || ''}
                  onChange={e => handleInputChange('phone', e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="formGroup">
                <label>Year of Study</label>
                <select
                  value={editForm.year || ''}
                  onChange={e => handleInputChange('year', e.target.value)}
                >
                  <option value="">Select Year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Graduate">Graduate</option>
                </select>
              </div>

              <div className="formGroup">
                <label>Department</label>
                <input
                  type="text"
                  value={editForm.department || ''}
                  onChange={e =>
                    handleInputChange('department', e.target.value)
                  }
                  placeholder="e.g., Computer Science & Engineering"
                />
              </div>

              <div className="formGroup fullWidth">
                <label>Bio</label>
                <textarea
                  value={editForm.bio || ''}
                  onChange={e => handleInputChange('bio', e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows="4"
                />
              </div>

              <div className="formGroup fullWidth">
                <label>Interests (comma-separated)</label>
                <input
                  type="text"
                  value={editForm.interests?.join(', ') || ''}
                  onChange={e => handleInterestsChange(e.target.value)}
                  placeholder="e.g., Programming, Music, Sports, Photography"
                />
              </div>

              <div className="socialSection fullWidth">
                <h3>Social Links</h3>
                <div className="socialGrid">
                  <div className="formGroup">
                    <label>Instagram</label>
                    <input
                      type="text"
                      value={editForm.social?.instagram || ''}
                      onChange={e =>
                        handleInputChange('social.instagram', e.target.value)
                      }
                      placeholder="Instagram username"
                    />
                  </div>

                  <div className="formGroup">
                    <label>LinkedIn</label>
                    <input
                      type="text"
                      value={editForm.social?.linkedin || ''}
                      onChange={e =>
                        handleInputChange('social.linkedin', e.target.value)
                      }
                      placeholder="LinkedIn profile URL"
                    />
                  </div>

                  <div className="formGroup">
                    <label>GitHub</label>
                    <input
                      type="text"
                      value={editForm.social?.github || ''}
                      onChange={e =>
                        handleInputChange('social.github', e.target.value)
                      }
                      placeholder="GitHub username"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="formActions">
              <button
                className="saveBtn"
                onClick={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                className="cancelBtn"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="profileDisplay">
            <div className="profileDetails">
              <div className="detailCard">
                <h3>Personal Information</h3>
                <div className="detailItem">
                  <span className="label">Full Name:</span>
                  <span className="value">
                    {profileData.name || 'Not provided'}
                  </span>
                </div>
                <div className="detailItem">
                  <span className="label">Email:</span>
                  <span className="value">
                    {profileData.email || 'Not provided'}
                  </span>
                </div>
                <div className="detailItem">
                  <span className="label">Phone:</span>
                  <span className="value">
                    {profileData.phone || 'Not provided'}
                  </span>
                </div>
                {rollNumber && (
                  <div className="detailItem">
                    <span className="label">Roll Number:</span>
                    <span className="value rollBadge">{rollNumber}</span>
                  </div>
                )}
              </div>

              <div className="detailCard">
                <h3>Academic Information</h3>
                <div className="detailItem">
                  <span className="label">Year:</span>
                  <span className="value">
                    {profileData.year || 'Not specified'}
                  </span>
                </div>
                <div className="detailItem">
                  <span className="label">Department:</span>
                  <span className="value">
                    {profileData.department || 'Not specified'}
                  </span>
                </div>
              </div>

              {profileData.bio && (
                <div className="detailCard">
                  <h3>About Me</h3>
                  <p className="bioText">{profileData.bio}</p>
                </div>
              )}

              {profileData.interests && profileData.interests.length > 0 && (
                <div className="detailCard">
                  <h3>Interests</h3>
                  <div className="interestTags">
                    {profileData.interests.map((interest, index) => (
                      <span key={index} className="interestTag">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(profileData.social?.instagram ||
                profileData.social?.linkedin ||
                profileData.social?.github) && (
                <div className="detailCard">
                  <h3>Social Links</h3>
                  <div className="socialLinks">
                    {profileData.social?.instagram && (
                      <a
                        href={`https://instagram.com/${profileData.social.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="socialLink instagram"
                      >
                        <span>Instagram</span>
                      </a>
                    )}
                    {profileData.social?.linkedin && (
                      <a
                        href={profileData.social.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="socialLink linkedin"
                      >
                        <span>LinkedIn</span>
                      </a>
                    )}
                    {profileData.social?.github && (
                      <a
                        href={`https://github.com/${profileData.social.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="socialLink github"
                      >
                        <span>GitHub</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render settings content
  const renderSettingsContent = () => {
    return (
      <div className={`settingsContent ${animateItems ? 'animate' : ''}`}>
        <div className="settingsCard">
          <h3>Account Settings</h3>
          <div className="settingItem">
            <span className="settingLabel">Email Notifications</span>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="slider"></span>
            </label>
          </div>
          <div className="settingItem">
            <span className="settingLabel">Profile Visibility</span>
            <label className="switch">
              <input type="checkbox" defaultChecked />
              <span className="slider"></span>
            </label>
          </div>
          <div className="settingItem">
            <span className="settingLabel">Show Contact Information</span>
            <label className="switch">
              <input type="checkbox" />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <div className="settingsCard">
          <h3>Privacy & Security</h3>
          <button className="settingBtn">Change Password</button>
          <button className="settingBtn">Download My Data</button>
          <button className="settingBtn danger">Delete Account</button>
        </div>
      </div>
    )
  }

  return (
    <Layout navigationPaths={navigationItems}>
      <PageMeta
        title={`${username || 'User'} Profile | UniTrader`}
        description="UniTrader is your friendly college-hood marketplace."
      />

      <div className="section">
        <div className="container">
          {/* Success/Error Messages */}
          {successMessage && (
            <div className="message success">{successMessage}</div>
          )}
          {errorMessage && <div className="message error">{errorMessage}</div>}

          <div className="profileContainer">
            <div className="headerWrapper">
              <div className="bannerContent">
                <h1>{username ? `Welcome, ${username}` : 'Welcome back!'}</h1>
              </div>
            </div>

            <div className="colsContainer">
              {/* Left Column: Profile Info */}
              <div className="leftCol">
                <div className="imgContainer">
                  <img
                    src={profileData.avatar || '/images/content/avatar.png'}
                    alt={profileData.name || 'User Avatar'}
                  />
                  <span className="statusDot"></span>
                </div>
                <h2>{username || profileData.name || 'User'}</h2>
                <p className="title">{profileData.title || 'Student'}</p>
                <p className="email">
                  {profileData.email || 'No email provided'}
                </p>
                {rollNumber && (
                  <p className="rollNumber">Roll No: {rollNumber}</p>
                )}

                {!isEditing && (
                  <button
                    className="editProfileBtn"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {/* Right Column: Tabs + Content */}
              <div className="rightCol">
                <nav>
                  <ul className="tabs">
                    {['profile', 'settings'].map(tab => (
                      <li key={tab}>
                        <button
                          onClick={() => handleTabChange(tab)}
                          className={activeTab === tab ? 'active' : ''}
                        >
                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>

                {activeTab === 'profile' && renderProfileContent()}
                {activeTab === 'settings' && renderSettingsContent()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="pageFooter">
        <p>© {new Date().getFullYear()} UniTrader - Your College Marketplace</p>
      </footer>
    </Layout>
  )
}

export default ProfilePage

export async function getServerSideProps() {
  const navigationItems = {
    logo: {
      imgix_url: '/cosmic.svg',
    },
    menu: [
      { title: 'Find Products', url: '/search' },
      { title: 'Sell Items', url: '/upload-details' },
      { title: 'Chat', url: '/chat' },
    ],
  }

  return {
    props: { navigationItems },
  }
}

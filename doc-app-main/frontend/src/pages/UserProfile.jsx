import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "./UserProfile.css";

const ProfileStat = ({ label, value }) => (
  <div className="profile-stat">
    <span className="stat-label">{label}</span>
    <span className="stat-value">{value || "—"}</span>
  </div>
);

const InfoItem = ({ icon, label, value, isEditable = false, onEdit, fieldName }) => (
  <div className="info-item">
    <div className="info-content-wrapper">
      <span className="info-label">{label}</span>
      <span className={`info-value ${!value ? 'empty' : ''}`}>{value || "Not provided"}</span>
    </div>
    {isEditable && (
      <button 
        className="edit-btn" 
        onClick={() => onEdit(fieldName, value)}
        aria-label={`Edit ${label}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
    )}
  </div>
);

const Avatar = ({ name, photoUrl, onPhotoChange }) => {
  const handlePhotoClick = () => {
    if (onPhotoChange) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          onPhotoChange(file);
        }
      };
      input.click();
    }
  };

  if (photoUrl) {
    return (
      <div className="profile-avatar-section">
        <div className="profile-avatar">
          <img src={photoUrl} alt={name} />
        </div>
        <button className="edit-avatar-btn" onClick={handlePhotoClick} aria-label="Change photo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </button>
      </div>
    );
  }
  
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";
    
  return (
    <div className="profile-avatar-section">
      <div className="profile-avatar initials">{initials}</div>
      <button className="edit-avatar-btn" onClick={handlePhotoClick} aria-label="Upload photo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      </button>
    </div>
  );
};

const EditModal = ({ isOpen, onClose, field, currentValue, onSave }) => {
  const [value, setValue] = useState(currentValue || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append(field, value);

      const res = await fetch("http://localhost:5000/api/user/profile", {
        method: "PUT",
        credentials: 'include',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      await onSave(field, value);
      onClose();
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getFieldConfig = (field) => {
    switch (field) {
      case 'displayName':
        return { label: 'Full Name', type: 'text', placeholder: 'Enter your full name' };
      case 'phoneNumber':
        return { label: 'Phone Number', type: 'tel', placeholder: '+1 (555) 123-4567' };
      case 'dob':
        return { label: 'Date of Birth', type: 'date', placeholder: '' };
      case 'address':
        return { label: 'Address', type: 'text', placeholder: 'Enter your address' };
      case 'bloodGroup':
        return { label: 'Blood Group', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] };
      case 'allergies':
        return { label: 'Allergies', type: 'text', placeholder: 'Enter any allergies or "None"' };
      case 'heightCm':
        return { label: 'Height (cm)', type: 'number', placeholder: '170' };
      case 'weightKg':
        return { label: 'Weight (kg)', type: 'number', placeholder: '70' };
      case 'emergencyContactName':
        return { label: 'Emergency Contact Name', type: 'text', placeholder: 'Enter emergency contact name' };
      case 'emergencyContactPhone':
        return { label: 'Emergency Contact Phone', type: 'tel', placeholder: '+1 (555) 123-4567' };
      case 'emergencyContactRelation':
        return { label: 'Emergency Contact Relation', type: 'text', placeholder: 'e.g., Spouse, Parent, Sibling' };
      default:
        return { label: field, type: 'text', placeholder: 'Enter value' };
    }
  };

  const config = getFieldConfig(field);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit {config.label}</h3>
          <button className="close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div className="modal-body">
          {config.type === 'select' ? (
            <select 
              value={value} 
              onChange={(e) => setValue(e.target.value)}
              className="form-input"
            >
              <option value="">Select {config.label}</option>
              {config.options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          ) : (
            <input
              type={config.type}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={config.placeholder}
              className="form-input"
            />
          )}
        </div>
        
        <div className="modal-footer">
          <button className="btn secondary-btn" onClick={onClose}>Cancel</button>
          <button 
            className="btn primary-btn" 
            onClick={handleSave}
            disabled={loading || !value.trim()}
          >
            {loading ? <span className="loading"></span> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

const API_BASE_URL = "http://localhost:5000/api";

const UserProfile = () => {
  const { currentUser, setCurrentUser, userProfile, updateUserProfile, getDisplayName, getPhotoURL, getCreationTime } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editModal, setEditModal] = useState({ isOpen: false, field: '', currentValue: '' });
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [extendedProfile, setExtendedProfile] = useState({
    dob: "",
    address: "",
    bloodGroup: "",
    allergies: "None",
    heightCm: "",
    weightKg: "",
    emergencyContact: {
      name: "",
      phone: "",
      relation: ""
    }
  });

  useEffect(() => {
    if (currentUser) {
      setExtendedProfile({
        dob: currentUser.dob || "",
        address: currentUser.address?.street || "",
        bloodGroup: currentUser.bloodGroup || "",
        allergies: Array.isArray(currentUser.allergies) ? currentUser.allergies.map(a => a.name).join(", ") : currentUser.allergies || "None",
        heightCm: currentUser.height || "",
        weightKg: currentUser.weight || "",
        emergencyContact: {
          name: currentUser.emergencyContact?.name || "",
          phone: currentUser.emergencyContact?.phone || "",
          relation: currentUser.emergencyContact?.relationship || ""
        }
      });
    }
  }, [currentUser]);

  const completedFields = [
    currentUser?.name,
    currentUser?.phone,
    extendedProfile.dob,
    extendedProfile.address,
    extendedProfile.bloodGroup,
    extendedProfile.allergies,
    extendedProfile.heightCm,
    extendedProfile.weightKg,
    extendedProfile.emergencyContact.name,
    extendedProfile.emergencyContact.phone,
    extendedProfile.emergencyContact.relation
  ].filter(Boolean).length;

  const profileCompletion = Math.round((completedFields / 11) * 100);

  const handleEdit = (field, currentValue) => {
    setEditModal({ isOpen: true, field, currentValue });
  };

  const handleSave = async (field, value) => {
    setLoading(true);
    try {
      // Create updates object for API
      const updates = {};
      
      // Map frontend field names to backend expectations if necessary
      if (field === 'displayName') updates.name = value;
      else if (field === 'emergencyContactName') updates.emergencyContactName = value;
      else if (field === 'emergencyContactPhone') updates.emergencyContactPhone = value;
      else if (field === 'emergencyContactRelation') updates.emergencyContactRelation = value;
      else updates[field] = value;

      const res = await fetch("http://localhost:5000/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Update failed");
      }

      const updatedUser = await res.json();
      setCurrentUser(updatedUser.user || updatedUser); // Update AuthContext with full object from backend
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = async (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const res = await fetch("http://localhost:5000/api/user/profile", {
        method: "PUT",
        credentials: 'include',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      updateUserProfile(data.user);
    } catch (error) {
      console.error('Photo update failed:', error);
    }
  };

  if (!currentUser) {
    return (
      <div className="profile-page">
        <div className="container">
          <div className="card">
            <p>Please log in to view your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  const user = {
    name: getDisplayName(),
    email: currentUser.email,
    phone: currentUser.phoneNumber || extendedProfile.phoneNumber || "",
    photoUrl: photoPreview || currentUser.profileImage ? `http://localhost:5000${currentUser.profileImage}` : getPhotoURL(),
    address: extendedProfile.address,
    bloodGroup: extendedProfile.bloodGroup,
    allergies: extendedProfile.allergies,
    heightCm: extendedProfile.heightCm,
    weightKg: extendedProfile.weightKg,
    emergencyContact: extendedProfile.emergencyContact,
    signupDate: getCreationTime()
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header card">
          <div className="profile-identity">
            <Avatar 
              name={user.name} 
              photoUrl={user.photoUrl} 
              onPhotoChange={handlePhotoChange}
            />
            <div>
              <h1 className="profile-name">{user.name}</h1>
              <div className="profile-badges">
                <span className="role-badge">Patient</span>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-summary-grid">
          <div className="summary-card card">
            <h3>Profile Completion</h3>
            <div className="completion-meter">
              <div className="completion-fill" style={{ width: `${profileCompletion}%` }} />
              <span>{profileCompletion}% complete</span>
            </div>
            <p>Keep your profile updated to receive personalized care recommendations and appointment reminders.</p>
          </div>
          <div className="summary-card card">
            <h3>Medical Snapshot</h3>
            <p><strong>Blood Group:</strong> {extendedProfile.bloodGroup || 'Not set'}</p>
            <p><strong>Allergies:</strong> {extendedProfile.allergies || 'Not set'}</p>
            <p><strong>Height:</strong> {extendedProfile.heightCm ? `${extendedProfile.heightCm} cm` : 'Not set'}</p>
          </div>
          <div className="summary-card card">
            <h3>Upcoming Care</h3>
            <p><strong>Phone:</strong> {currentUser?.phoneNumber || 'Not set'}</p>
            <p><strong>Address:</strong> {extendedProfile.address || 'Not set'}</p>
            <p><strong>Emergency:</strong> {extendedProfile.emergencyContact.name || 'Not set'}</p>
          </div>
        </div>

        <div className="profile-content-grid">
          <div className="info-card card">
            <h2 className="section-heading">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              Contact info
            </h2>
            <div className="info-list">
              <InfoItem icon="📧" label="Email" value={user.email} />
              <InfoItem 
                icon="📱" 
                label="Phone" 
                value={user.phone} 
                isEditable={true}
                onEdit={handleEdit}
                fieldName="phoneNumber"
              />
              <InfoItem 
                icon="📍" 
                label="Address" 
                value={user.address} 
                isEditable={true}
                onEdit={handleEdit}
                fieldName="address"
              />
            </div>
          </div>

          <div className="info-card card">
            <h2 className="section-heading">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              Personal details
            </h2>
            <div className="info-list">
              <InfoItem 
                icon="🎂" 
                label="Date of Birth" 
                value={extendedProfile.dob ? new Date(extendedProfile.dob).toLocaleDateString() : null} 
                isEditable={true}
                onEdit={handleEdit}
                fieldName="dob"
              />
              <InfoItem 
                icon="🩸" 
                label="Blood Group" 
                value={user.bloodGroup} 
                isEditable={true}
                onEdit={handleEdit}
                fieldName="bloodGroup"
              />
              <InfoItem 
                icon="⚠️" 
                label="Allergies" 
                value={user.allergies} 
                isEditable={true}
                onEdit={handleEdit}
                fieldName="allergies"
              />
              <InfoItem 
                icon="📏" 
                label="Height" 
                value={user.heightCm ? `${user.heightCm} cm` : null} 
                isEditable={true}
                onEdit={handleEdit}
                fieldName="heightCm"
              />
              <InfoItem 
                icon="⚖️" 
                label="Weight" 
                value={user.weightKg ? `${user.weightKg} kg` : null} 
                isEditable={true}
                onEdit={handleEdit}
                fieldName="weightKg"
              />
            </div>
          </div>

          <div className="info-card card">
            <h2 className="section-heading">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Emergency contact
            </h2>
            <div className="info-list">
              <InfoItem 
                icon="👤" 
                label="Name" 
                value={user.emergencyContact?.name} 
                isEditable={true}
                onEdit={handleEdit}
                fieldName="emergencyContactName"
              />
              <InfoItem 
                icon="🤝" 
                label="Relation" 
                value={user.emergencyContact?.relation} 
                isEditable={true}
                onEdit={handleEdit}
                fieldName="emergencyContactRelation"
              />
              <InfoItem 
                icon="📞" 
                label="Phone" 
                value={user.emergencyContact?.phone} 
                isEditable={true}
                onEdit={handleEdit}
                fieldName="emergencyContactPhone"
              />
            </div>
          </div>
        </div>
      </div>

      <EditModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, field: '', currentValue: '' })}
        field={editModal.field}
        currentValue={editModal.currentValue}
        onSave={handleSave}
      />
    </div>
  );
};

export default UserProfile;

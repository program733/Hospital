import React, { useState } from 'react';
import axios from 'axios';

const PatientForm = ({ onPatientAdded }) => {
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault();
        axios.post('http://localhost:8000/patients/', { name, age: parseInt(age), gender })
            .then(response => {
                console.log(response.data);
                setName('');
                setAge('');
                setGender('');
                if (onPatientAdded) {
                    onPatientAdded();
                }
            })
            .catch(error => {
                console.error('There was an error creating the patient!', error);
            });
    };

    return (
        <form onSubmit={handleSubmit}>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name" required />
            <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="Age" required />
            <input type="text" value={gender} onChange={e => setGender(e.target.value)} placeholder="Gender" required />
            <button type="submit">Add Patient</button>
        </form>
    );
};

export default PatientForm;

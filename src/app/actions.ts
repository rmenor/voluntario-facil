'use server';

import { z } from 'zod';
import { getUserByEmail, addUser as dbAddVolunteer, updateUser as dbUpdateVolunteer, deleteUser as dbDeleteUser, addPosition as dbAddPosition, updatePosition as dbUpdatePosition, deletePosition as dbDeletePosition, addShift as dbAddShift, updateShift as dbUpdateShift, addAssembly as dbAddAssembly, associateVolunteerToAssembly as dbAssociateVolunteer, updateAssembly as dbUpdateAssembly, rejectShift as dbRejectShift, getUser, addMessageToConversation } from '@/lib/data';
import { revalidatePath } from 'next/cache';

const loginSchema = z.object({
  email: z.string().email('Email no válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export async function login(prevState: any, formData: FormData) {
  const validatedFields = loginSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;
  const user = await getUserByEmail(email);

  if (!user || user.passwordHash !== password) {
    return {
      error: { form: ['Email o contraseña incorrectos.'] },
    };
  }
  
  const { passwordHash, ...userWithoutPassword } = user;
  
  return {
    success: true,
    user: userWithoutPassword,
  };
}

const volunteerSchema = z.object({
    name: z.string().min(2, 'El nombre es obligatorio'),
    email: z.string().email('Email no válido'),
    phone: z.string().min(1, 'El teléfono es obligatorio'),
    role: z.enum(['admin', 'volunteer'])
});

export async function addVolunteer(prevState: any, formData: FormData) {
    const validatedFields = volunteerSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return { success: false, error: 'Datos no válidos' };
    }

    try {
        await dbAddVolunteer({ ...validatedFields.data, passwordHash: 'password' });
        revalidatePath('/admin');
        return { success: true, message: 'Voluntario añadido correctamente.' };
    } catch (e) {
        return { success: false, error: 'No se pudo añadir el voluntario' };
    }
}

const updateVolunteerSchema = volunteerSchema.extend({
    userId: z.string().min(1, 'ID de usuario no válido'),
});

export async function updateVolunteer(prevState: any, formData: FormData) {
    const validatedFields = updateVolunteerSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return { success: false, error: 'Datos no válidos' };
    }
    
    const { userId, ...dataToUpdate } = validatedFields.data;

    try {
        await dbUpdateVolunteer(userId, dataToUpdate);
        revalidatePath('/admin');
        revalidatePath('/dashboard');
        return { success: true, message: 'Voluntario actualizado correctamente.' };
    } catch (e) {
        return { success: false, error: 'No se pudo actualizar el voluntario' };
    }
}

const deleteVolunteerSchema = z.object({
    userId: z.string().min(1, 'ID de usuario no válido'),
});

export async function deleteVolunteer(prevState: any, formData: FormData) {
    const validatedFields = deleteVolunteerSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return { success: false, error: 'Datos no válidos.' };
    }

    try {
        await dbDeleteUser(validatedFields.data.userId);
        revalidatePath('/admin');
        revalidatePath('/dashboard');
        return { success: true, message: 'Voluntario eliminado correctamente.' };
    } catch (e) {
        const message = e instanceof Error ? e.message : 'No se pudo eliminar el voluntario.';
        return { success: false, error: message };
    }
}

const updateProfileSchema = z.object({
    userId: z.string().min(1, 'ID de usuario no válido'),
    name: z.string().min(2, 'El nombre es obligatorio'),
    email: z.string().email('Email no válido'),
    phone: z.string().min(1, 'El teléfono es obligatorio'),
});

export async function updateProfile(prevState: any, formData: FormData) {
    const validatedFields = updateProfileSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return { success: false, error: 'Datos no válidos' };
    }

    const { userId, ...dataToUpdate } = validatedFields.data;

    try {
        await dbUpdateVolunteer(userId, dataToUpdate);
        revalidatePath('/dashboard');
        const updatedUser = await getUser(userId);
        
        if (!updatedUser) {
            return { success: false, error: 'No se pudo encontrar al usuario actualizado.' };
        }
        
        const { passwordHash, ...userWithoutPassword } = updatedUser;

        return { 
            success: true, 
            message: 'Perfil actualizado correctamente.',
            user: userWithoutPassword
        };
    } catch(e) {
        return { success: false, error: 'No se pudo actualizar el perfil.' };
    }
}

const positionSchema = z.object({
    name: z.string().min(2, 'El nombre es obligatorio'),
    description: z.string().min(1, 'La descripción es obligatoria'),
    iconName: z.string().min(1, 'El icono es obligatorio'),
    assemblyId: z.string().min(1, 'El ID de asamblea es obligatorio'),
});

export async function addPosition(prevState: any, formData: FormData) {
    const validatedFields = positionSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return { success: false, error: 'Datos no válidos' };
    }
    
    try {
        await dbAddPosition(validatedFields.data);
        revalidatePath(`/admin/${validatedFields.data.assemblyId}`);
        return { success: true, message: 'Posición añadida correctamente.' };
    } catch (e) {
        return { success: false, error: 'No se pudo añadir la posición' };
    }
}

const updatePositionSchema = positionSchema.extend({
    positionId: z.string().min(1, 'ID de posición no válido'),
});

export async function updatePosition(prevState: any, formData: FormData) {
    const validatedFields = updatePositionSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return { success: false, error: 'Datos no válidos.' };
    }
    const { positionId, ...dataToUpdate } = validatedFields.data;
    try {
        await dbUpdatePosition(positionId, dataToUpdate);
        revalidatePath(`/admin/${dataToUpdate.assemblyId}`);
        return { success: true, message: 'Posición actualizada correctamente.' };
    } catch(e) {
        return { success: false, error: 'No se pudo actualizar la posición.' };
    }
}

const deletePositionSchema = z.object({
    positionId: z.string().min(1, 'ID de posición no válido'),
    assemblyId: z.string().min(1, 'El ID de asamblea es obligatorio'),
});

export async function deletePosition(prevState: any, formData: FormData) {
    const validatedFields = deletePositionSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!validatedFields.success) {
        return { success: false, error: 'Datos no válidos.' };
    }

    try {
        await dbDeletePosition(validatedFields.data.positionId);
        revalidatePath(`/admin/${validatedFields.data.assemblyId}`);
        return { success: true, message: 'Posición eliminada correctamente.' };
    } catch(e) {
        return { success: false, error: 'No se pudo eliminar la posición.' };
    }
}


const assemblySchema = z.object({
    title: z.string().min(3, 'El título es obligatorio'),
    startDate: z.string().min(1, "La fecha de inicio es obligatoria"),
    endDate: z.string().min(1, "La fecha de fin es obligatoria"),
    type: z.enum(['regional', 'circuito']),
})

export async function addAssembly(prevState: any, formData: FormData) {
    const validatedFields = assemblySchema.safeParse(Object.fromEntries(formData.entries()));

    if(!validatedFields.success) {
        return { success: false, error: "Datos no válidos." };
    }
    
    const { title, startDate, endDate, type } = validatedFields.data;
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end < start) {
        return { success: false, error: "La fecha de fin debe ser posterior o igual a la de inicio." };
    }

    try {
        await dbAddAssembly({ title, startDate: start, endDate: end, type });
        revalidatePath('/admin');
        return { success: true, message: "Asamblea creada correctamente." };
    } catch (e) {
        return { success: false, error: "No se pudo crear la asamblea." };
    }
}

const updateAssemblySchema = assemblySchema.extend({
    assemblyId: z.string().min(1),
    volunteerIds: z.array(z.string()).optional(),
});

export async function updateAssembly(prevState: any, formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = updateAssemblySchema.safeParse({
        ...rawData,
        volunteerIds: formData.getAll('volunteerIds'),
    });

    if (!validatedFields.success) {
        console.log(validatedFields.error.flatten())
        return { success: false, error: "Datos no válidos." };
    }

    const { assemblyId, title, startDate, endDate, volunteerIds, type } = validatedFields.data;
    
    const dataToUpdate: any = {
        title,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        volunteerIds: volunteerIds || [],
        type,
    }

    if (dataToUpdate.endDate < dataToUpdate.startDate) {
        return { success: false, error: "La fecha de fin debe ser posterior o igual a la de inicio." };
    }

    try {
        await dbUpdateAssembly(assemblyId, dataToUpdate);
        revalidatePath('/admin');
        revalidatePath(`/admin/${assemblyId}`);
        revalidatePath('/dashboard');
        return { success: true, message: "Asamblea actualizada correctamente." };
    } catch (e) {
        const message = e instanceof Error ? e.message : 'No se pudo actualizar la asamblea.';
        return { success: false, error: message };
    }
}

export async function associateVolunteerToAssembly(assemblyId: string, volunteerId: string) {
    try {
        await dbAssociateVolunteer(assemblyId, volunteerId);
        revalidatePath('/admin');
        revalidatePath(`/admin/${assemblyId}`);
        revalidatePath('/dashboard');
        return { success: true };
    } catch (e) {
        const message = e instanceof Error ? e.message : 'No se pudo asociar el voluntario.';
        return { success: false, error: message };
    }
}

const shiftSchema = z.object({
    positionId: z.string(),
    volunteerId: z.string().nullable(),
    startTime: z.string(),
    endTime: z.string(),
    assemblyId: z.string(),
    date: z.string(),
});

export async function addShift(prevState: any, formData: FormData) {
    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = shiftSchema.safeParse({
        ...rawData,
        volunteerId: rawData.volunteerId === 'null' ? null : rawData.volunteerId,
    });
    
    if (!validatedFields.success) {
        console.log(validatedFields.error.flatten());
        return { success: false, error: 'Datos no válidos.' };
    }

    const { positionId, volunteerId, startTime, endTime, assemblyId, date } = validatedFields.data;
    
    const shiftDate = new Date(date);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startDateTime = new Date(shiftDate.getFullYear(), shiftDate.getMonth(), shiftDate.getDate(), startHour, startMinute);
    const endDateTime = new Date(shiftDate.getFullYear(), shiftDate.getMonth(), shiftDate.getDate(), endHour, endMinute);

    if (endDateTime <= startDateTime) {
        return { success: false, error: 'La hora de fin debe ser posterior a la de inicio.' };
    }

    try {
        await dbAddShift({ positionId, volunteerId, startTime: startDateTime, endTime: endDateTime, assemblyId });
        revalidatePath(`/admin/${assemblyId}`);
        revalidatePath('/dashboard');
        return { success: true, message: 'Turno creado correctamente.' };
    } catch (e) {
        return { success: false, error: 'No se pudo añadir el turno' };
    }
}

export async function assignVolunteerToShift(shiftId: string, volunteerId: string | null, assemblyId: string) {
    try {
        await dbUpdateShift(shiftId, volunteerId);
        revalidatePath(`/admin/${assemblyId}`);
        revalidatePath('/dashboard');
        return { success: true };
    } catch (e) {
        return { success: false, error: 'No se pudo asignar el voluntario' };
    }
}

const rejectShiftSchema = z.object({
    shiftId: z.string().min(1),
    reason: z.string().optional(),
    volunteerId: z.string().min(1),
    assemblyId: z.string().min(1),
});

export async function rejectShift(prevState: any, formData: FormData) {
    const validatedFields = rejectShiftSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return { success: false, error: 'Datos no válidos.' };
    }
    
    const { shiftId, volunteerId, reason, assemblyId } = validatedFields.data;

    try {
        await dbRejectShift(shiftId, volunteerId, reason || null);
        revalidatePath('/dashboard');
        revalidatePath(`/admin/${assemblyId}`);
        return { success: true, message: 'Turno rechazado.' };
    } catch(e) {
        const message = e instanceof Error ? e.message : 'No se pudo rechazar el turno.';
        return { success: false, error: message };
    }
}

const sendMessageSchema = z.object({
    conversationId: z.string().min(1),
    senderId: z.string().min(1),
    message: z.string().min(1, "El mensaje no puede estar vacío."),
});

export async function sendMessage(prevState: any, formData: FormData) {
    const validatedFields = sendMessageSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return { success: false, error: "Datos no válidos." };
    }

    try {
        await addMessageToConversation(validatedFields.data.conversationId, validatedFields.data.senderId, validatedFields.data.message);
        revalidatePath(`/dashboard/chat/${validatedFields.data.conversationId}`);
        revalidatePath(`/dashboard/chat`);
        return { success: true };
    } catch(e) {
        const message = e instanceof Error ? e.message : "No se pudo enviar el mensaje.";
        return { success: false, error: message };
    }
}

'use server';

import { z } from 'zod';
import { getUserByEmail, addUser as dbAddVolunteer, updateUser as dbUpdateVolunteer, addPosition as dbAddPosition, addShift as dbAddShift, updateShift as dbUpdateShift, addAssembly as dbAddAssembly, associateVolunteerToAssembly as dbAssociateVolunteer, updateAssembly as dbUpdateAssembly, rejectShift as dbRejectShift, getUser } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import { useAuth } from '@/hooks/use-auth';

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

  // NOTE: In a real app, you would hash and compare passwords.
  // For this demo, we are doing a simple string comparison.
  if (!user || user.passwordHash !== password) {
    return {
      error: { form: ['Email o contraseña incorrectos.'] },
    };
  }
  
  // Omit password from user object returned to the client
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
});


export async function addPosition(prevState: any, formData: FormData) {
    const validatedFields = positionSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return { success: false, error: 'Datos no válidos' };
    }
    
    try {
        await dbAddPosition({
          name: validatedFields.data.name,
          description: validatedFields.data.description,
          iconName: validatedFields.data.iconName
        });
        revalidatePath('/admin');
        return { success: true, message: 'Posición añadida correctamente.' };
    } catch (e) {
        return { success: false, error: 'No se pudo añadir la posición' };
    }
}

const assemblySchema = z.object({
    title: z.string().min(3, 'El título es obligatorio'),
    startDate: z.string().min(1, "La fecha de inicio es obligatoria"),
    endDate: z.string().min(1, "La fecha de fin es obligatoria"),
})

export async function addAssembly(prevState: any, formData: FormData) {
    const validatedFields = assemblySchema.safeParse(Object.fromEntries(formData.entries()));

    if(!validatedFields.success) {
        return { success: false, error: "Datos no válidos." };
    }
    
    const { title, startDate, endDate } = validatedFields.data;
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end < start) {
        return { success: false, error: "La fecha de fin debe ser posterior o igual a la de inicio." };
    }

    try {
        await dbAddAssembly({ title, startDate: start, endDate: end });
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

    const { assemblyId, title, startDate, endDate, volunteerIds } = validatedFields.data;
    
    const dataToUpdate: any = {
        title,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        volunteerIds: volunteerIds || []
    }

    if (dataToUpdate.endDate < dataToUpdate.startDate) {
        return { success: false, error: "La fecha de fin debe ser posterior o igual a la de inicio." };
    }

    try {
        await dbUpdateAssembly(assemblyId, dataToUpdate);
        revalidatePath('/admin');
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
        revalidatePath('/admin');
        revalidatePath('/dashboard');
        return { success: true, message: 'Turno creado correctamente.' };
    } catch (e) {
        return { success: false, error: 'No se pudo añadir el turno' };
    }
}

export async function assignVolunteerToShift(shiftId: string, volunteerId: string | null) {
    try {
        await dbUpdateShift(shiftId, volunteerId);
        revalidatePath('/admin');
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
});

export async function rejectShift(prevState: any, formData: FormData) {
    const validatedFields = rejectShiftSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return { success: false, error: 'Datos no válidos.' };
    }
    
    try {
        await dbRejectShift(validatedFields.data.shiftId, validatedFields.data.volunteerId, validatedFields.data.reason || null);
        revalidatePath('/dashboard');
        revalidatePath('/admin');
        return { success: true, message: 'Turno rechazado.' };
    } catch(e) {
        const message = e instanceof Error ? e.message : 'No se pudo rechazar el turno.';
        return { success: false, error: message };
    }
}

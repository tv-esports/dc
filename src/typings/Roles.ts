export const ELIXIR_INTRO_PRO_ROLE_ID: string = process.env.ELIXIR_INTRO_PRO_ROLE_ID;
export const TEST_COURSE_PRO_ROLE_ID: string = process.env.TEST_COURSE_PRO_ROLE_ID;

type RoleProps = {
    [courseName: string]: string;
};

export const rolesForCourses: RoleProps = {
    "Elixir: A Comprehensive Introduction": ELIXIR_INTRO_PRO_ROLE_ID,
    "Phoenix LiveView Unleashed": TEST_COURSE_PRO_ROLE_ID,
};
import ImmutablePropTypes from 'react-immutable-proptypes';
import PropTypes from 'prop-types';
import randomColor from 'randomcolor';
import {Set} from 'immutable';

import * as util from '@/util/misc';

const keyFields = [
  'school',
  'department',
  'courseNumber',
  'courseCodeSuffix',
  'section',
];

export function courseKey(course) {
  return keyFields.map(field => course.get(field)).join('/');
}

const codeKeyFields = [
  'department',
  'courseNumber',
  'courseCodeSuffix',
];

export function courseCodeKey(course) {
  return codeKeyFields.map(field => course.get(field)).join('/');
}

const sortKeyFields = [
  'department',
  'courseNumber',
  'courseCodeSuffix',
  'school',
  'section',
];

export function courseSortKey(course) {
  return sortKeyFields.map(field => course.get(field));
}

export const coursesSortCompare = util.sortKeyComparator(
  courseSortKey,
);

export function courseCode(course) {
  return (
    course.get('department') +
    ' ' +
    course
      .get('courseNumber')
      .toString()
      .padStart(3, '0') +
    course.get('courseCodeSuffix')
  );
}

export function courseSection(course) {
  return (
    course.get('school') +
    '-' +
    course
      .get('section')
      .toString()
      .padStart(2, '0')
  );
}

export function courseFullCode(course) {
  return courseCode(course) + ' ' + courseSection(course);
}

export function courseStatusString(course) {
  return (
    `${course.get('courseStatus')}, ` +
    `${course.get('openSeats')}/${course.get(
      'totalSeats',
    )} seats filled`
  );
}

export function courseFacultyString(course) {
  return util.commaJoin(course.get('faculty').toJS());
}

export function courseHalfSemesters(course) {
  return (
    course.get('firstHalfSemester') + course.get('secondHalfSemester')
  );
}

export function courseCredits(course) {
  return course.get('quarterCredits') / 4;
}

export function courseMatches(course, search) {
  const queries = search.toLowerCase().split(/\s+/);

  const code = courseCode(course)
    .toLowerCase()
    .replace(/\s+/, '');
  const section = courseSection(course).toLowerCase();
  const name = course.get('courseName').toLowerCase();

  function matchesSubquery(subquery) {
    if (
      code.includes(subquery) ||
      section.includes(subquery) ||
      name.includes(subquery)
    ) {
      return true;
    }

    for (const instructor of course.get('faculty')) {
      if (instructor.includes(subquery)) {
        return true;
      }
    }

    return false;
  }

  for (const subquery of queries) {
    if (!matchesSubquery(subquery)) {
      return false;
    }
  }

  return true;
}

export function courseColor(course, format = 'hex') {
  return randomColor({
    luminosity: 'light',
    seed: courseFullCode(course),
    format,
  });
}

function daysOverlap(daysA, daysB) {
  const daysASet = new Set(daysA);
  for (const dayB of daysB) {
    if (daysASet.has(dayB)) {
      return true;
    }
  }
  return false;
}

export function parseTime(timeString) {
  const [hourString, minuteString] = timeString.split(':');
  return {
    hour: parseInt(hourString),
    minute: parseInt(minuteString),
  };
}

export function timeToMinutes({hour, minute}) {
  return hour * 60 + minute;
}

export function coursesConflict(courseA, courseB) {
  if (
    !(
      (courseA.get('firstHalfSemester') &&
        courseB.get('firstHalfSemester')) ||
      (courseA.get('secondHalfSemester') &&
        courseB.get('secondHalfSemester'))
    )
  ) {
    return false;
  }

  for (const slotA of courseA.get('schedule')) {
    for (const slotB of courseB.get('schedule')) {
      if (!daysOverlap(slotA.get('days'), slotB.get('days'))) {
        continue;
      }

      const startA = timeToMinutes(parseTime(slotA.get('startTime'))),
        startB = timeToMinutes(parseTime(slotB.get('startTime'))),
        endA = timeToMinutes(parseTime(slotA.get('endTime'))),
        endB = timeToMinutes(parseTime(slotB.get('endTime')));

      if (
        (startA <= startB && startB < endA) ||
        (startB <= startA && startA < endB)
      ) {
        return true;
      }
    }
  }

  return false;
}

export function coursesEquivalent(courseA, courseB) {
  return courseCodeKey(courseA) === courseCodeKey(courseB);
}

export const coursePropType = ImmutablePropTypes.mapContains({
  courseCodeSuffix: PropTypes.string.isRequired,
  courseName: PropTypes.string.isRequired,
  courseNumber: PropTypes.number.isRequired,
  courseStatus: PropTypes.string.isRequired,
  department: PropTypes.string.isRequired,
  endDate: PropTypes.string.isRequired,
  faculty: ImmutablePropTypes.listOf(PropTypes.string).isRequired,
  firstHalfSemester: PropTypes.bool.isRequired,
  openSeats: PropTypes.number.isRequired,
  quarterCredits: PropTypes.number.isRequired,
  schedule: ImmutablePropTypes.listOf(
    ImmutablePropTypes.mapContains({
      days: PropTypes.string.isRequired,
      endTime: PropTypes.string.isRequired,
      startTime: PropTypes.string.isRequired,
    }),
  ).isRequired,
  school: PropTypes.string.isRequired,
  secondHalfSemester: PropTypes.bool.isRequired,
  section: PropTypes.number.isRequired,
  startDate: PropTypes.string.isRequired,
  totalSeats: PropTypes.number.isRequired,
});

'use client';

import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ComponentPalette } from './ComponentPalette';
import { PageDropZones } from './PageDropZones';
import { useEditMode } from '../../contexts/editModeContext';
import { useDragDrop } from '../../lib/drag-drop/useDragDrop';
import { Compo